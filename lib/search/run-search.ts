import { buildSupportPlan } from "@/lib/matching/plan";
import { rankResources } from "@/lib/matching/score";
import { getCatalogResources } from "@/lib/resources/catalog";

import { buildSearchCriteria, type SearchRequest } from "./parse-request";

export async function runSearch(input: SearchRequest) {
  const { criteria, crisis, aiFallback, summary } =
    await buildSearchCriteria(input);

  const resources = await getCatalogResources({
    userLat: criteria.userLat ?? undefined,
    userLon: criteria.userLon ?? undefined,
    radiusKm: criteria.radiusKm,
    categories: criteria.categories.length ? criteria.categories : undefined,
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
