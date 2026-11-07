import { describe, expect, it } from "vitest";
import {
  buildUserContext,
  mergeContextWithIntent,
  toLlmSafeContext,
} from "@/lib/personalization/build-user-context";

describe("buildUserContext", () => {
  it("handles a fully skipped onboarding", () => {
    for (const raw of [undefined, null, {}, "garbage", 42]) {
      const ctx = buildUserContext(raw);
      expect(ctx.location).toBeNull();
      expect(ctx.kidsAges).toEqual([]);
      expect(Object.values(ctx.answered).every((v) => v === false)).toBe(true);
    }
  });

  it("normalizes a realistic night-shift parent", () => {
    const ctx = buildUserContext({
      postalCode: "t2r 0a1",
      kidsAges: ["4", 9],
      needs: ["Daycare", "after-school", "food bank"],
      budget: "free",
      language: "en-CA",
    });
    expect(ctx.location?.source).toBe("postal_fsa");
    expect(ctx.location?.label).toMatch(/^T2R/);
    expect(ctx.kidsAges).toEqual([4, 9]);
    expect(ctx.ageBands).toEqual(["preschool", "school_age"]);
    expect(ctx.needs).toEqual(["childcare", "food"]); // "after-school" folds into childcare
    expect(ctx.budget).toBe("free_only");
    expect(ctx.maxMonthlyCostCad).toBe(0);
    expect(ctx.language).toBe("en");
  });

  it("never keeps more than the FSA and coarsens coordinates", () => {
    const ctx = buildUserContext({ postalCode: "T2R 0A1" });
    expect(JSON.stringify(ctx)).not.toContain("0A1");
    const decimals = (n: number) => (n.toString().split(".")[1] ?? "").length;
    expect(decimals(ctx.location!.lat)).toBeLessThanOrEqual(2);
    expect(decimals(ctx.location!.lng)).toBeLessThanOrEqual(2);
  });

  it("falls back to neighbourhood, and rejects non-Calgary postal codes", () => {
    expect(buildUserContext({ postalCode: "M5V 2T6", neighbourhood: "Forest Lawn" }).location?.source).toBe(
      "neighbourhood",
    );
    expect(buildUserContext({ postalCode: "M5V 2T6" }).location).toBeNull();
  });

  it("drops invalid ages and unknown values instead of failing", () => {
    const ctx = buildUserContext({
      kidsAges: [-1, 2.7, 25, Number.NaN, 0],
      needs: ["unicorns", "childcare", "childcare"],
      budget: "a billion",
      language: "klingon",
    });
    expect(ctx.kidsAges).toEqual([0, 2]);
    expect(ctx.ageBands).toEqual(["infant", "toddler"]);
    expect(ctx.needs).toEqual(["childcare"]);
    expect(ctx.budget).toBeNull();
    expect(ctx.language).toBeNull();
  });

  it("merges free-text intent over onboarding", () => {
    const ctx = buildUserContext({ kidsAges: [7], needs: ["food"], budget: "moderate" });
    const merged = mergeContextWithIntent(ctx, {
      categories: ["childcare"],
      kidsAges: [4],
      budget: "free_only",
      language: null,
    });
    expect(merged.kidsAges).toEqual([4]);
    expect(merged.needs).toEqual(["childcare", "food"]);
    expect(merged.maxMonthlyCostCad).toBe(0);
  });

  it("LLM-safe projection contains no location data", () => {
    const safe = toLlmSafeContext(buildUserContext({ postalCode: "T2R 0A1", kidsAges: [4] }));
    expect(safe).toEqual({ kidsAges: [4], needs: [], budget: null, language: null, hasLocation: true });
    expect(JSON.stringify(safe)).not.toMatch(/T2R|lat|lng/);
  });
});

describe("buildUserContext — one bad field never wipes the others", () => {
  it("keeps valid answers when siblings are malformed", () => {
    const ctx = buildUserContext({
      postalCode: 12345,
      kidsAges: [3, "x", { a: 1 }, null, "6"],
      needs: ["food", 7, null],
      budget: ["free"],
      language: "Punjabi",
    });
    expect(ctx.location).toBeNull();
    expect(ctx.kidsAges).toEqual([3, 6]);
    expect(ctx.needs).toEqual(["food"]);
    expect(ctx.budget).toBeNull();
    expect(ctx.language).toBe("pa");
  });
});
