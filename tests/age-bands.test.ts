import { describe, expect, it } from "vitest";

import {
  CHILD_AGE_BANDS,
  CHILD_AGE_BAND_LABELS,
  CHILD_AGE_BAND_MONTHS,
} from "@/lib/db/schema-constants";
import { rankResources, type SearchCriteria } from "@/lib/matching/score";
import { getCatalogResourcesSync } from "@/lib/resources/catalog";
import { buildSearchCriteria } from "@/lib/search/parse-request";

describe("Kinora age bands", () => {
  it("defines five product age bands with labels and month maps", () => {
    expect(CHILD_AGE_BANDS).toEqual([
      "ages_0_3",
      "ages_3_8",
      "ages_8_12",
      "ages_12_17",
      "ages_18_plus",
    ]);
    for (const band of CHILD_AGE_BANDS) {
      expect(CHILD_AGE_BAND_LABELS[band]).toBeTruthy();
      const [min, max] = CHILD_AGE_BAND_MONTHS[band];
      expect(max).toBeGreaterThan(min);
    }
  });

  it("scores with ages_0_3 without throwing", () => {
    const criteria: SearchCriteria = {
      categories: ["childcare"],
      childAgeBands: ["ages_0_3"],
      childAgeMonths: null,
      costPreference: null,
      urgency: "low",
      language: null,
      radiusKm: 15,
      userLat: null,
      userLon: null,
    };
    const ranked = rankResources(getCatalogResourcesSync(), criteria);
    expect(ranked.length).toBeGreaterThan(0);
  });
});

describe("search keyword fallback", () => {
  it("maps coding and chores text to activities and meet-parents", async () => {
    const coding = await buildSearchCriteria({
      text: "Volunteer groups with coding activities for my kid",
      radiusKm: 15,
    });
    expect(coding.criteria.categories).toContain("activities");

    const chores = await buildSearchCriteria({
      text: "Ways to share chores with other parents nearby",
      radiusKm: 15,
    });
    expect(chores.criteria.categories).toContain("activities");
    expect(chores.criteria.openToMeetParents).toBe(true);
  });

  it("accepts new child age band query values", async () => {
    const result = await buildSearchCriteria({
      childAgeBands: ["ages_8_12", "ages_12_17"],
      radiusKm: 10,
    });
    expect(result.criteria.childAgeBands).toEqual([
      "ages_8_12",
      "ages_12_17",
    ]);
  });
});
