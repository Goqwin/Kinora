import { differenceInCalendarDays, parseISO } from "date-fns";

import {
  CHILD_AGE_BAND_MONTHS,
  type ChildAgeBand,
} from "@/lib/db/schema-constants";
import type { CatalogResource } from "@/lib/resources/types";

import { MATCH_OTHER, MATCH_WEIGHTS } from "./weights";

export type SearchCriteria = {
  categories: string[];
  childAgeBands: ChildAgeBand[];
  childAgeMonths: number | null;
  costPreference: "free" | "subsidized" | "any" | null;
  urgency: "low" | "medium" | "high" | null;
  language: string | null;
  radiusKm: number;
  userLat: number | null;
  userLon: number | null;
  /** Preference or free-text hangout intent; boosts community matches. */
  openToMeetParents?: boolean;
};

export type ScoredResource = CatalogResource & {
  score: number;
  scoreParts: {
    category: number;
    age: number;
    proximity: number;
    cost: number;
    other: number;
  };
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function wantsParentHangouts(criteria: SearchCriteria): boolean {
  return Boolean(
    criteria.openToMeetParents ||
      criteria.categories.includes("community"),
  );
}

function ageScore(
  resource: CatalogResource,
  criteria: SearchCriteria,
): number {
  // Parent hangout / community listings are often adults-only. Do not penalize
  // them when the search is about meeting other parents.
  if (
    wantsParentHangouts(criteria) &&
    resource.category === "community" &&
    resource.ageMinMonths === null &&
    resource.ageMaxMonths === null
  ) {
    return MATCH_WEIGHTS.age;
  }

  if (criteria.childAgeMonths === null && criteria.childAgeBands.length === 0) {
    return MATCH_WEIGHTS.age;
  }

  const min = resource.ageMinMonths;
  const max = resource.ageMaxMonths;
  if (min === null && max === null) return MATCH_WEIGHTS.age * 0.6;

  const months =
    criteria.childAgeMonths ??
    (criteria.childAgeBands.length > 0
      ? CHILD_AGE_BAND_MONTHS[criteria.childAgeBands[0]][0]
      : null);

  if (months === null) return MATCH_WEIGHTS.age * 0.5;
  if (min !== null && max !== null && months >= min && months <= max) {
    return MATCH_WEIGHTS.age;
  }
  if (min !== null && months >= min) return MATCH_WEIGHTS.age * 0.7;
  return MATCH_WEIGHTS.age * 0.25;
}

function proximityScore(
  resource: CatalogResource,
  criteria: SearchCriteria,
): number {
  if (criteria.userLat === null || criteria.userLon === null) {
    return MATCH_WEIGHTS.proximity * 0.5;
  }
  const km =
    resource.distanceKm ??
    haversineKm(
      criteria.userLat,
      criteria.userLon,
      resource.latitude,
      resource.longitude,
    );
  const ratio = Math.max(0, 1 - km / Math.max(criteria.radiusKm, 1));
  return MATCH_WEIGHTS.proximity * ratio;
}

function costScore(resource: CatalogResource, criteria: SearchCriteria): number {
  if (!criteria.costPreference || criteria.costPreference === "any") {
    return MATCH_WEIGHTS.cost;
  }
  if (criteria.costPreference === "free" && resource.costType === "free") {
    return MATCH_WEIGHTS.cost;
  }
  if (
    criteria.costPreference === "subsidized" &&
    (resource.costType === "subsidized" ||
      resource.costType === "income_based" ||
      resource.costType === "free")
  ) {
    return MATCH_WEIGHTS.cost;
  }
  if (resource.costType === criteria.costPreference) return MATCH_WEIGHTS.cost;
  return MATCH_WEIGHTS.cost * 0.35;
}

function otherScore(resource: CatalogResource, criteria: SearchCriteria): number {
  let score = 0;
  if (
    criteria.language &&
    resource.languages.map((l) => l.toLowerCase()).includes(criteria.language)
  ) {
    score += MATCH_OTHER.language;
  }
  const verifiedAt = parseISO(resource.lastVerifiedAt);
  if (differenceInCalendarDays(new Date(), verifiedAt) <= 180) {
    score += MATCH_OTHER.verified;
  }
  if (criteria.urgency === "high") {
    if (resource.category === "food" || resource.category === "financial") {
      score += MATCH_OTHER.urgency;
    }
  }
  if (wantsParentHangouts(criteria) && resource.category === "community") {
    score += MATCH_OTHER.parentHangout;
  }
  return Math.min(score, MATCH_WEIGHTS.other);
}

export function scoreResource(
  resource: CatalogResource,
  criteria: SearchCriteria,
): ScoredResource {
  const categoryMatch =
    criteria.categories.length === 0 ||
    criteria.categories.includes(resource.category) ||
    (wantsParentHangouts(criteria) && resource.category === "community");
  const categoryPart = categoryMatch
    ? MATCH_WEIGHTS.category
    : MATCH_WEIGHTS.category * 0.15;

  const parts = {
    category: categoryPart,
    age: ageScore(resource, criteria),
    proximity: proximityScore(resource, criteria),
    cost: costScore(resource, criteria),
    other: otherScore(resource, criteria),
  };

  return {
    ...resource,
    score:
      parts.category + parts.age + parts.proximity + parts.cost + parts.other,
    scoreParts: parts,
  };
}

export function rankResources(
  resources: CatalogResource[],
  criteria: SearchCriteria,
): ScoredResource[] {
  return resources
    .filter((r) => r.isActive)
    .map((r) => scoreResource(r, criteria))
    .sort((a, b) => b.score - a.score);
}
