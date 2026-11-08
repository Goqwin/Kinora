/**
 * Runs the full personalization pipeline (lib/personalization) for the live
 * /plan search and maps its output to the SearchPayload shape the plan
 * components already render, so the UI does not change.
 *
 * If Gemini's plan is missing (AI off, short text, failure, or no time left),
 * the plan falls back to today's template plan and aiFallback is true, which
 * shows the existing keyword banner. The parent's text is never logged.
 * Server-only (the pipeline uses the database).
 */
import { CHILD_AGE_BAND_MONTHS } from "@/lib/db/schema-constants";
import { isAiEnabled } from "@/lib/env";
import { buildSupportPlan as buildTemplatePlan, type PlanAction } from "@/lib/matching/plan";
import type { ScoredResource, SearchCriteria } from "@/lib/matching/score";
import { resolveLocation } from "@/lib/personalization/build-user-context";
import type { SupportPlan } from "@/lib/personalization/generate-plan";
import type { RankedResource } from "@/lib/personalization/retrieve";
import { buildSupportPlan } from "@/lib/personalization/support-plan";
import { detectCrisis } from "@/lib/safety";

import type { SearchRequest } from "./parse-request";
import type { SearchPayload } from "./run-search";

const BUDGET_FROM_COST = { free: "free_only", subsidized: "low", any: null } as const;

function kidsAgesFrom(input: SearchRequest): number[] {
  if (input.childAgeYears !== null && input.childAgeYears !== undefined) return [input.childAgeYears];
  // Age bands only: use the middle of each band, in whole years.
  return (input.childAgeBands ?? []).map((band) => {
    const [min, max] = CHILD_AGE_BAND_MONTHS[band];
    return Math.floor((min + max) / 2 / 12);
  });
}

function toScored(r: RankedResource): ScoredResource {
  const s = (v: string | null | undefined) => v ?? "";
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    category: r.category,
    subcategory: s(r.subcategory),
    addressLine: s(r.addressLine),
    city: r.city ?? "Calgary",
    postalCode: s(r.postalCode),
    longitude: r.longitude,
    latitude: r.latitude,
    costType: r.costType,
    costNotes: s(r.costNotes),
    ageMinMonths: r.ageMinMonths,
    ageMaxMonths: r.ageMaxMonths,
    eligibilitySummary: s(r.eligibilitySummary),
    eligibilityRequirements: r.eligibilityRequirements ?? [],
    languages: r.languages ?? [],
    phone: s(r.phone),
    email: s(r.email),
    website: s(r.website),
    sourceUrl: r.sourceUrl,
    lastVerifiedAt: r.lastVerifiedAt.slice(0, 10),
    verifiedBy: s(r.verifiedBy),
    isActive: r.isActive,
    distanceKm: r.distanceKm ?? undefined,
    // The pipeline scores 0–1 (+0.1 bonus); the UI shows a score out of 100.
    score: Math.min(100, Math.round(r.score * 100)),
    scoreParts: { category: 0, age: 0, proximity: 0, cost: 0, other: 0 },
  };
}

/** Gemini steps cite resource ids; the UI links one resource per step, by slug, no repeats. */
function toActions(plan: SupportPlan, results: RankedResource[]): PlanAction[] {
  const slugById = new Map(results.map((r) => [r.id, r.slug]));
  const used = new Set<string>();
  const actions: PlanAction[] = [];
  for (const step of plan.steps) {
    const slug = step.resourceIds.map((id) => slugById.get(id)).find((x) => x && !used.has(x));
    if (!slug) continue;
    used.add(slug);
    actions.push({
      resourceSlug: slug,
      title: step.title,
      reason: step.reason,
      firstStep: step.firstStep,
      priority: actions.length + 1,
    });
  }
  return actions;
}

export async function runPersonalizedSearch(input: SearchRequest): Promise<SearchPayload> {
  const text = input.text?.trim() ?? "";
  const res = await buildSupportPlan(
    {
      text,
      onboarding: {
        postalCode: input.postal,
        kidsAges: kidsAgesFrom(input),
        needs: input.categories ?? [],
        budget: input.costPreference ? BUDGET_FROM_COST[input.costPreference] : undefined,
        language: input.language ?? undefined,
      },
    },
    null, // no auth0Sub: viewing a plan never saves it; the Save button does that
    { radiusKm: input.radiusKm, aiEnabled: isAiEnabled() },
  );

  const location = resolveLocation(input.postal ?? null);
  const categories = [...new Set([...res.intent.categories, ...(input.categories ?? [])])];
  const criteria: SearchCriteria = {
    categories,
    childAgeBands: input.childAgeBands ?? [],
    childAgeMonths:
      input.childAgeYears !== null && input.childAgeYears !== undefined ? input.childAgeYears * 12 : null,
    costPreference: input.costPreference ?? null,
    urgency: res.intent.urgency === "crisis" ? "high" : res.intent.urgency,
    language: res.intent.language ?? input.language ?? null,
    radiusKm: input.radiusKm,
    userLat: location?.lat ?? null,
    userLon: location?.lng ?? null,
    openToMeetParents: Boolean(input.openToMeetParents) || categories.includes("community"),
  };

  const results = res.results.map(toScored);
  const actions = res.plan ? toActions(res.plan, res.results) : [];
  const plan = actions.length
    ? { actions, summary: res.intent.summary || "Here is a plan based on your message." }
    : buildTemplatePlan(results, criteria);

  // Either keyword checker can flag a crisis; neither can clear the other.
  const liveCrisis = detectCrisis(text);
  return {
    crisis: {
      matched: res.crisis || liveCrisis.matched,
      categories: [...new Set([...liveCrisis.categories, ...res.intent.crisisSignals])],
    },
    aiFallback: actions.length === 0 || res.usedFallback,
    criteria,
    plan,
    results,
  };
}
