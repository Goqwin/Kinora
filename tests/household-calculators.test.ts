import { describe, expect, it } from "vitest";

import {
  APPLIANCE_PRESETS,
  applianceUsage,
  budgetSummary,
  combinedUsage,
  formatCad,
  parseAmount,
  parseHours,
  parsePercent,
  relativeShares,
  savingsEstimate,
} from "@/lib/household/calculators";

describe("parseAmount", () => {
  it("treats empty input as not filled in, not an error", () => {
    expect(parseAmount("")).toEqual({ value: null, error: null });
    expect(parseAmount("   ")).toEqual({ value: null, error: null });
  });

  it("accepts plain, decimal and money-formatted numbers", () => {
    expect(parseAmount("1200").value).toBe(1200);
    expect(parseAmount("$1,200.50").value).toBe(1200.5);
    expect(parseAmount(" .5 ").value).toBe(0.5);
    expect(parseAmount("0").value).toBe(0);
  });

  it("rejects negatives, text and absurd values with a message", () => {
    expect(parseAmount("-5")).toEqual({ value: null, error: "Enter 0 or more." });
    expect(parseAmount("abc").error).toBe("Enter a number.");
    expect(parseAmount("1e5").error).toBe("Enter a number.");
    expect(parseAmount("12.3.4").error).toBe("Enter a number.");
    expect(parseAmount("99999999999").error).toBe("That number is too large.");
  });

  it("caps hours at 24 and percentages at 100", () => {
    expect(parseHours("24").value).toBe(24);
    expect(parseHours("25").error).toBe("A day has at most 24 hours.");
    expect(parsePercent("100").value).toBe(100);
    expect(parsePercent("101").error).toBe("Enter a percentage from 0 to 100.");
  });
});

describe("electricity cost", () => {
  it("follows the spec formulas", () => {
    const usage = applianceUsage({ watts: 1500, hoursPerDay: 2 }, 0.2);
    expect(usage.dailyKwh).toBe(3);
    expect(usage.monthlyKwh).toBe(90);
    expect(usage.dailyCost).toBeCloseTo(0.6);
    expect(usage.monthlyCost).toBeCloseTo(18);
    expect(usage.annualCost).toBeCloseTo(219);
  });

  it("adds several appliances into one total", () => {
    const total = combinedUsage([{ watts: 1500, hoursPerDay: 2 }, { watts: 100, hoursPerDay: 10 }], 0.2);
    expect(total.dailyKwh).toBe(4);
    expect(total.monthlyCost).toBeCloseTo(24);
  });

  it("returns zeros for no appliances", () => {
    expect(combinedUsage([], 0.2).monthlyCost).toBe(0);
  });
});

describe("budget", () => {
  it("totals expenses, computes the remaining balance and each share", () => {
    const summary = budgetSummary(3000, [
      { label: "Rent", amount: 1500 },
      { label: "Food", amount: 500 },
    ]);
    expect(summary.totalExpenses).toBe(2000);
    expect(summary.remaining).toBe(1000);
    expect(summary.lines[0].shareOfExpenses).toBeCloseTo(0.75);
  });

  it("allows a negative remaining balance when spending exceeds income", () => {
    expect(budgetSummary(1000, [{ label: "Rent", amount: 1500 }]).remaining).toBe(-500);
  });

  it("does not divide by zero with no expenses", () => {
    expect(budgetSummary(1000, [{ label: "Rent", amount: 0 }]).lines[0].shareOfExpenses).toBe(0);
  });
});

describe("savings", () => {
  it("projects cost and savings from a percentage reduction", () => {
    const s = savingsEstimate(600, 0.2, 10);
    expect(s.currentMonthlyCost).toBeCloseTo(120);
    expect(s.projectedMonthlyCost).toBeCloseTo(108);
    expect(s.monthlySavings).toBeCloseTo(12);
    expect(s.annualSavings).toBeCloseTo(144);
  });
});

describe("usage estimator", () => {
  it("has unique, sensible presets", () => {
    expect(new Set(APPLIANCE_PRESETS.map((p) => p.id)).size).toBe(APPLIANCE_PRESETS.length);
    for (const p of APPLIANCE_PRESETS) {
      expect(p.watts).toBeGreaterThan(0);
      expect(p.hoursPerDay).toBeGreaterThan(0);
      expect(p.hoursPerDay).toBeLessThanOrEqual(24);
    }
  });

  it("scales comparison bars to the largest value", () => {
    expect(relativeShares([1, 2, 4])).toEqual([0.25, 0.5, 1]);
    expect(relativeShares([0, 0])).toEqual([0, 0]);
  });
});

describe("formatCad", () => {
  it("formats Canadian dollars", () => {
    expect(formatCad(1234.5)).toBe("$1,234.50");
    expect(formatCad(-500)).toBe("-$500.00");
  });
});

describe("energy assistance matching", async () => {
  const { isEnergyAssistance } = await import("@/components/household/energy-assistance");
  const r = (name: string, description = "", subcategory = "") => ({ name, description, subcategory });
  it("matches utility and energy bill help", () => {
    expect(isEnergyAssistance(r("Utility Payment Help"))).toBe(true);
    expect(isEnergyAssistance(r("Fund", "Help with electricity and heating costs"))).toBe(true);
    expect(isEnergyAssistance(r("Fund", "", "power bill assistance"))).toBe(true);
  });
  it("ignores unrelated financial programs", () => {
    expect(isEnergyAssistance(r("Child Care Subsidy Office", "Fee subsidies for child care"))).toBe(false);
    expect(isEnergyAssistance(r("Electrician apprenticeship"))).toBe(false);
  });
});
