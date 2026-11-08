import { isDatabaseConfigured } from "@/lib/db";
import { buildSupportPlan, type SupportPlanResult } from "@/lib/matching/plan";
import { rankResources, type ScoredResource, type SearchCriteria } from "@/lib/matching/score";
import { getCatalogResources } from "@/lib/resources/catalog";

import { buildSearchCriteria, type SearchRequest } from "./parse-request";
import { runPersonalizedSearch } from "./personalized";

/** What the /plan page renders. Both search paths return exactly this. */
export type SearchPayload = {
  crisis: { matched: boolean; categories: string[] };
  aiFallback: boolean;
  criteria: SearchCriteria;
  plan: SupportPlanResult;
  results: ScoredResource[];
};

/**
 * Full personalization pipeline when the database is connected; the basic
 * keyword/CSV search otherwise, or if the pipeline throws (e.g. DB down).
 */
export async function runSearch(input: SearchRequest): Promise<SearchPayload> {
  if (isDatabaseConfigured()) {
    try {
      return await runPersonalizedSearch(input);
    } catch (e) {
      // Error type only: never the parent's text.
      console.warn("search: personalization failed, using basic search:", e instanceof Error ? e.name : typeof e);
    }
  }
  return runBasicSearch(input);
}

async function runBasicSearch(input: SearchRequest): Promise<SearchPayload> {
  const { criteria, crisis, aiFallback, summary } =
    await buildSearchCriteria(input);

  // Do not hard-filter by category. Categories stay on criteria for scoring so
  // plans can still diversify across the catalog (target 4 to 5 options).
  const resources = await getCatalogResources({
    userLat: criteria.userLat ?? undefined,
    userLon: criteria.userLon ?? undefined,
    radiusKm: criteria.radiusKm,
  });

  const ranked = rankResources(resources, criteria);
  const plan = buildSupportPlan(ranked, criteria, summary);

  return {
    crisis,
    aiFallback,
    criteria,
    plan,
    results: ranked.slice(0, 10),
  };
}
