import { buildSupportPlan } from "@/lib/matching/plan";
import { rankResources } from "@/lib/matching/score";
import { getCatalogResources } from "@/lib/resources/catalog";

import { buildSearchCriteria, type SearchRequest } from "./parse-request";

export async function runSearch(input: SearchRequest) {
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
