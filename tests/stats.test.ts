import { describe, expect, it } from "vitest";

import { formatCompact, formatSignedPct, indexSeries, niceTicks, percentOf } from "@/lib/stats/chart";
import { ALBERTA, CANADA, CENSUS_2021, YEARS } from "@/lib/stats/families";

describe("family estimates", () => {
  it("has one value per year in every series", () => {
    for (const series of [CANADA, ALBERTA]) {
      for (const values of [series.total, series.couple, series.oneParent]) {
        expect(values).toHaveLength(YEARS.length);
      }
    }
  });

  it("adds couple and one-parent families up to the total", () => {
    for (const series of [CANADA, ALBERTA]) {
      series.total.forEach((total, i) => {
        expect(series.couple[i] + series.oneParent[i]).toBe(total);
      });
    }
  });

  it("splits 2021 one-parent families into shares that sum to 100", () => {
    expect(CENSUS_2021.ledByWomenPct + CENSUS_2021.ledByMenPct).toBeCloseTo(100);
  });
});

describe("chart helpers", () => {
  it("indexes a series to 100 at the first value", () => {
    const indexed = indexSeries(CANADA.oneParent);
    expect(indexed[0]).toBe(100);
    expect(indexed.at(-1)).toBeCloseTo(105.28, 2);
    expect(indexSeries(ALBERTA.oneParent).at(-1)).toBeCloseTo(110.96, 2);
  });

  it("returns zeros when the base is zero", () => {
    expect(indexSeries([0, 5])).toEqual([0, 0]);
  });

  it("computes the one-parent share of Canadian families in 2024", () => {
    expect(percentOf(CANADA.oneParent[3], CANADA.total[3])).toBeCloseTo(16.83, 2);
    expect(percentOf(1, 0)).toBe(0);
  });

  it("produces clean, evenly spaced ticks that cover the range", () => {
    const ticks = niceTicks(0, 206_891, 4);
    expect(ticks[0]).toBe(0);
    expect(ticks.at(-1)).toBeGreaterThanOrEqual(206_891);
    const steps = ticks.slice(1).map((t, i) => t - ticks[i]);
    expect(new Set(steps).size).toBe(1);
  });

  it("formats numbers for labels", () => {
    expect(formatCompact(206_891)).toBe("206.9K");
    expect(formatSignedPct(5.28)).toBe("+5.3%");
  });
});
