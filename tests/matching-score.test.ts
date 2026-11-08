import { describe, expect, it } from "vitest";

import { rankResources, type SearchCriteria } from "@/lib/matching/score";
import { getCatalogResourcesSync } from "@/lib/resources/catalog";

const baseCriteria: SearchCriteria = {
  categories: ["childcare"],
  childAgeBands: [],
  childAgeMonths: 36,
  costPreference: "subsidized",
  urgency: "low",
  language: "en",
  radiusKm: 25,
  userLat: 51.04,
  userLon: -113.98,
};

describe("matching score", () => {
  it("ranks childcare ahead of unrelated categories", () => {
    const ranked = rankResources(getCatalogResourcesSync(), baseCriteria);
    expect(ranked[0]?.category).toBe("childcare");
    expect(ranked[0]!.score).toBeGreaterThan(ranked.at(-1)!.score);
  });

  it("boosts food when urgency is high", () => {
    const ranked = rankResources(getCatalogResourcesSync(), {
      ...baseCriteria,
      categories: [],
      urgency: "high",
    });
    const food = ranked.find((r) => r.category === "food");
    expect(food).toBeTruthy();
    expect(food!.scoreParts.other).toBeGreaterThan(0);
  });

  it("boosts community when openToMeetParents is set", () => {
    const without = rankResources(getCatalogResourcesSync(), baseCriteria);
    const withHangout = rankResources(getCatalogResourcesSync(), {
      ...baseCriteria,
      openToMeetParents: true,
    });
    const communityWithout = without.find((r) => r.category === "community");
    const communityWith = withHangout.find((r) => r.category === "community");
    if (!communityWithout || !communityWith) return;
    expect(communityWith.score).toBeGreaterThan(communityWithout.score);
  });
});
