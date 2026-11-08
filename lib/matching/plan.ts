import { categoryLabel } from "@/lib/resources/catalog";
import type { CatalogResource } from "@/lib/resources/types";

import type { ScoredResource, SearchCriteria } from "./score";

export type PlanAction = {
  resourceSlug: string;
  title: string;
  reason: string;
  firstStep: string;
  priority: number;
};

export type SupportPlanResult = {
  actions: PlanAction[];
  summary: string;
};

/** Target number of plan steps when the catalog has enough matches. */
export const PLAN_ACTION_TARGET = 5;

const ELIGIBILITY_TAIL =
  "Potentially eligible. Confirm with the provider.";

function displayName(resource: CatalogResource): string {
  return resource.name.replace(/^PLACEHOLDER\s+/i, "");
}

function wantsParentHangouts(criteria: SearchCriteria): boolean {
  return Boolean(
    criteria.openToMeetParents ||
      criteria.categories.includes("community"),
  );
}

function templateReason(resource: CatalogResource): string {
  if (resource.category === "community") {
    return `${displayName(resource)} is a place to meet other parents for company, hangouts, or shared errands. ${resource.costNotes}. ${ELIGIBILITY_TAIL}`;
  }
  const age =
    resource.ageMinMonths !== null && resource.ageMaxMonths !== null
      ? `ages ${Math.floor(resource.ageMinMonths / 12)} to ${Math.floor(resource.ageMaxMonths / 12)}`
      : "a range of ages";
  return `${displayName(resource)} offers ${categoryLabel(resource.category)} for ${age}. ${resource.costNotes}. ${ELIGIBILITY_TAIL}`;
}

function titleFor(resource: CatalogResource): string {
  if (resource.category === "community") {
    return `Connect with other parents at ${displayName(resource)}`;
  }
  return `Connect with ${displayName(resource)}`;
}

function firstStepFor(resource: CatalogResource): string {
  if (resource.category === "community") {
    if (resource.website) {
      return "Open the group page and ask about the next meetup or hangout.";
    }
    if (resource.phone) {
      return `Call ${resource.phone} and ask how to join a parent meetup.`;
    }
    return "Read the listing and write down one question about joining.";
  }
  if (resource.phone) {
    return `Call ${resource.phone} to ask about intake and wait times.`;
  }
  if (resource.website) {
    return "Open the provider website and note what documents they ask for.";
  }
  return "Read the eligibility summary and write down two questions to ask.";
}

function alreadyPicked(picked: ScoredResource[], slug: string): boolean {
  return picked.some((p) => p.slug === slug);
}

export function buildSupportPlan(
  ranked: ScoredResource[],
  criteria: SearchCriteria,
  summary?: string,
): SupportPlanResult {
  const target = Math.min(PLAN_ACTION_TARGET, ranked.length);
  const picked: ScoredResource[] = [];
  const seenCategories = new Set<string>();

  if (criteria.urgency === "high") {
    const urgent = ranked.find(
      (r) => r.category === "food" || r.category === "financial",
    );
    if (urgent) {
      picked.push(urgent);
      seenCategories.add(urgent.category);
    }
  }

  if (wantsParentHangouts(criteria)) {
    const hangout = ranked.find(
      (r) =>
        r.category === "community" && !alreadyPicked(picked, r.slug),
    );
    if (hangout) {
      picked.push(hangout);
      seenCategories.add(hangout.category);
    }
  }

  for (const row of ranked) {
    if (picked.length >= target) break;
    if (alreadyPicked(picked, row.slug)) continue;
    if (seenCategories.has(row.category) && picked.length >= 2) continue;
    picked.push(row);
    seenCategories.add(row.category);
  }

  for (const row of ranked) {
    if (picked.length >= target) break;
    if (alreadyPicked(picked, row.slug)) continue;
    picked.push(row);
  }

  const actions: PlanAction[] = picked.slice(0, target).map((row, index) => ({
    resourceSlug: row.slug,
    title: titleFor(row),
    reason: templateReason(row),
    firstStep: firstStepFor(row),
    priority: index + 1,
  }));

  const planSummary =
    summary ??
    (criteria.categories.length > 0
      ? `We focused on ${criteria.categories.map(categoryLabel).join(", ")} near Calgary.`
      : "Here are a few verified starting points based on your filters.");

  return { actions, summary: planSummary };
}
