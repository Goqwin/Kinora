import { describe, expect, it } from "vitest";

import {
  PLAN_ACTION_TARGET,
  buildSupportPlan,
} from "@/lib/matching/plan";
import { rankResources, type SearchCriteria } from "@/lib/matching/score";
import { getCatalogResourcesSync } from "@/lib/resources/catalog";

const baseCriteria: SearchCriteria = {
  categories: ["childcare"],
  childAgeBands: [],
  childAgeMonths: 48,
  costPreference: null,
  urgency: "low",
  language: null,
  radiusKm: 25,
  userLat: 51.04,
  userLon: -114.07,
};

describe("buildSupportPlan depth", () => {
  it(`returns up to ${PLAN_ACTION_TARGET} actions when the catalog is large enough`, () => {
    const catalog = getCatalogResourcesSync();
    expect(catalog.length).toBeGreaterThanOrEqual(PLAN_ACTION_TARGET);

    const ranked = rankResources(catalog, baseCriteria);
    const plan = buildSupportPlan(ranked, baseCriteria);

    expect(plan.actions.length).toBe(
      Math.min(PLAN_ACTION_TARGET, ranked.length),
    );
    expect(plan.actions.length).toBeGreaterThanOrEqual(4);
  });

  it("reserves a community step when openToMeetParents is set", () => {
    const ranked = rankResources(getCatalogResourcesSync(), {
      ...baseCriteria,
      openToMeetParents: true,
    });
    const hasCommunity = ranked.some((r) => r.category === "community");
    if (!hasCommunity) return;

    const plan = buildSupportPlan(ranked, {
      ...baseCriteria,
      openToMeetParents: true,
    });
    const communityAction = plan.actions.find((a) =>
      a.title.toLowerCase().includes("other parents"),
    );
    expect(communityAction).toBeTruthy();
  });

  it("uses hangout wording for community resources", () => {
    const ranked = rankResources(getCatalogResourcesSync(), {
      ...baseCriteria,
      categories: ["community"],
      openToMeetParents: true,
      childAgeMonths: null,
    });
    const community = ranked.find((r) => r.category === "community");
    if (!community) return;

    const plan = buildSupportPlan([community], {
      ...baseCriteria,
      categories: ["community"],
      openToMeetParents: true,
    });
    expect(plan.actions[0]?.title).toMatch(/other parents/i);
    expect(plan.actions[0]?.reason).toMatch(/hangouts|company|errands/i);
  });
});
