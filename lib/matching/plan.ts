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

const ELIGIBILITY_TAIL =
  "May be eligible. Confirm with the provider.";

function templateReason(resource: CatalogResource): string {
  const age =
    resource.ageMinMonths !== null && resource.ageMaxMonths !== null
      ? `ages ${Math.floor(resource.ageMinMonths / 12)} to ${Math.floor(resource.ageMaxMonths / 12)}`
      : "a range of ages";
  return `${resource.name} offers ${categoryLabel(resource.category)} for ${age}. ${resource.costNotes}. ${ELIGIBILITY_TAIL}`;
}

function firstStepFor(resource: CatalogResource): string {
  if (resource.phone) {
    return `Call ${resource.phone} to ask about intake and wait times.`;
  }
  if (resource.website) {
    return "Open the provider website and note what documents they ask for.";
  }
  return "Read the eligibility summary and write down two questions to ask.";
}

export function buildSupportPlan(
  ranked: ScoredResource[],
  criteria: SearchCriteria,
  summary?: string,
): SupportPlanResult {
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

  for (const row of ranked) {
    if (picked.length >= 4) break;
    if (picked.some((p) => p.slug === row.slug)) continue;
    if (seenCategories.has(row.category) && picked.length >= 2) continue;
    picked.push(row);
    seenCategories.add(row.category);
  }

  for (const row of ranked) {
    if (picked.length >= 4) break;
    if (picked.some((p) => p.slug === row.slug)) continue;
    picked.push(row);
  }

  const actions: PlanAction[] = picked.slice(0, 4).map((row, index) => ({
    resourceSlug: row.slug,
    title: `Connect with ${row.name.replace(/^PLACEHOLDER\s+/i, "")}`,
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
