import { describe, expect, it } from "vitest";

import { runSearch } from "@/lib/search/run-search";

describe("runSearch", () => {
  it("returns plan results with AI disabled", async () => {
    const result = await runSearch({
      categories: ["childcare"],
      radiusKm: 25,
      childAgeYears: 3,
      costPreference: "subsidized",
    });
    expect(result.aiFallback).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.plan.actions.length).toBeGreaterThan(0);
  });

  it("surfaces crisis panel for crisis phrases", async () => {
    const result = await runSearch({
      text: "I have no food tonight for my kids",
      radiusKm: 15,
    });
    expect(result.crisis.matched).toBe(true);
  });
});
