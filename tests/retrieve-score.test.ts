import { describe, expect, it } from "vitest";
import { costLabel, scoreResource } from "../src/lib/personalization/retrieve";
import type { ScheduleTag } from "../src/lib/personalization/types";

const base = {
  category: "childcare",
  costType: "free",
  ageMinMonths: 0 as number | null,
  ageMaxMonths: 71 as number | null, // 0–5 years
  schedule: [] as string[],
};
const demo = { needs: ["childcare" as const], kidsAges: [4], budget: "free_only" as const };

describe("scoreResource", () => {
  it("gives a perfect, adjacent, free, age-fit match the full 1.0", () => {
    expect(scoreResource(base, 0, demo)).toBe(1);
  });

  it("weights category 0.4, distance 0.25, cost 0.2, age 0.15", () => {
    expect(scoreResource({ ...base, category: "food" }, 0, demo)).toBe(0.6);
    expect(scoreResource(base, 20, demo)).toBe(0.75);
    expect(scoreResource({ ...base, costType: "paid" }, 0, demo)).toBe(0.8);
    expect(scoreResource({ ...base, ageMinMonths: 72, ageMaxMonths: 155 }, 0, demo)).toBe(0.85);
  });

  it("ranks nearer resources higher, all else equal", () => {
    expect(scoreResource(base, 2, demo)).toBeGreaterThan(scoreResource(base, 8, demo));
  });

  it("scores free above reduced-cost above paid, even on a free-only budget", () => {
    const free = scoreResource(base, 0, demo);
    const subsidized = scoreResource({ ...base, costType: "subsidized" }, 0, demo);
    const incomeBased = scoreResource({ ...base, costType: "income_based" }, 0, demo);
    const paid = scoreResource({ ...base, costType: "paid" }, 0, { ...demo, budget: "flexible" });
    expect(subsidized).toBe(incomeBased);
    expect(free).toBeGreaterThan(subsidized);
    expect(subsidized).toBeGreaterThan(paid);
  });

  it("matches ages in months: a 4-year-old spans 48–59 months", () => {
    expect(scoreResource({ ...base, ageMinMonths: 60, ageMaxMonths: 71 }, 0, demo)).toBe(0.85); // starts at 5
    expect(scoreResource({ ...base, ageMinMonths: 0, ageMaxMonths: 48 }, 0, demo)).toBe(1); // up to 4y0m
    expect(scoreResource({ ...base, ageMinMonths: 59, ageMaxMonths: null }, 0, demo)).toBe(1);
  });

  it("scores parent-facing (no age limit) resources between fit and misfit", () => {
    expect(scoreResource({ ...base, ageMinMonths: null, ageMaxMonths: null }, 0, demo)).toBe(0.925);
  });

  it("adds a capped bonus for schedule matches", () => {
    const nightOwl = { ...base, schedule: ["evenings", "overnight", "weekends"] };
    const plain = scoreResource(base, 4, demo);
    const all: ScheduleTag[] = ["evenings", "overnight", "weekends"];
    expect(scoreResource(nightOwl, 4, demo, ["evenings"])).toBeCloseTo(plain + 0.05, 5);
    expect(scoreResource(nightOwl, 4, demo, all)).toBeCloseTo(plain + 0.1, 5);
    expect(scoreResource(base, 4, demo, ["evenings"])).toBe(plain);
  });

  it("uses neutral scores for an empty context", () => {
    const empty = { needs: [], kidsAges: [], budget: null };
    // category .5*.4 + distance .5*.25 + cost 1*.2 + age .5*.15
    expect(scoreResource(base, null, empty)).toBe(0.6);
  });
});

describe("costLabel", () => {
  it("says 'may be eligible' for reduced-cost options, never plain 'eligible'", () => {
    for (const t of ["subsidized", "income_based"]) {
      expect(costLabel(t)).toMatch(/^May be eligible for reduced cost$/);
    }
    expect(costLabel("free")).toBe("Free");
    expect(costLabel("paid")).toBe("Paid");
  });
});
