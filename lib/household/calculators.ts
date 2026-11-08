/**
 * Household cost calculators. Pure functions: no I/O, no React, so every formula
 * and validation rule is unit tested. All results are estimates.
 */

export const DAYS_PER_MONTH = 30;
export const DAYS_PER_YEAR = 365;
export const MONTHS_PER_YEAR = 12;
const MAX_AMOUNT = 10_000_000;

export type Parsed = { value: number | null; error: string | null };

type ParseOptions = { max?: number; maxMessage?: string };

/**
 * Read a number a person typed. Empty input is "not filled in", not an error.
 * Accepts "$1,200" and " 1200 ". Rejects negatives, non-numbers and huge values.
 */
export function parseAmount(raw: string, options: ParseOptions = {}): Parsed {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "") return { value: null, error: null };
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return { value: null, error: "Enter a number." };
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { value: null, error: "Enter a number." };
  if (value < 0) return { value: null, error: "Enter 0 or more." };
  const max = options.max ?? MAX_AMOUNT;
  if (value > max) return { value: null, error: options.maxMessage ?? "That number is too large." };
  return { value, error: null };
}

export const parseHours = (raw: string) =>
  parseAmount(raw, { max: 24, maxMessage: "A day has at most 24 hours." });

export const parsePercent = (raw: string) =>
  parseAmount(raw, { max: 100, maxMessage: "Enter a percentage from 0 to 100." });

const cad = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const kwh = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 });

export const formatCad = (value: number) => cad.format(value);
export const formatKwh = (value: number) => `${kwh.format(value)} kWh`;

/* ---------- Tool 1: electricity cost ---------- */

export type ApplianceInput = { watts: number; hoursPerDay: number };

export type UsageCost = {
  dailyKwh: number;
  monthlyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  annualCost: number;
};

/** Daily kWh = W × h ÷ 1000; monthly = daily × 30; annual cost uses 365 days. */
export function applianceUsage({ watts, hoursPerDay }: ApplianceInput, ratePerKwh: number): UsageCost {
  const dailyKwh = (watts * hoursPerDay) / 1000;
  const monthlyKwh = dailyKwh * DAYS_PER_MONTH;
  return {
    dailyKwh,
    monthlyKwh,
    dailyCost: dailyKwh * ratePerKwh,
    monthlyCost: monthlyKwh * ratePerKwh,
    annualCost: dailyKwh * DAYS_PER_YEAR * ratePerKwh,
  };
}

export function combinedUsage(appliances: ApplianceInput[], ratePerKwh: number): UsageCost {
  return appliances
    .map((a) => applianceUsage(a, ratePerKwh))
    .reduce<UsageCost>(
      (sum, u) => ({
        dailyKwh: sum.dailyKwh + u.dailyKwh,
        monthlyKwh: sum.monthlyKwh + u.monthlyKwh,
        dailyCost: sum.dailyCost + u.dailyCost,
        monthlyCost: sum.monthlyCost + u.monthlyCost,
        annualCost: sum.annualCost + u.annualCost,
      }),
      { dailyKwh: 0, monthlyKwh: 0, dailyCost: 0, monthlyCost: 0, annualCost: 0 },
    );
}

/* ---------- Tool 2: household budget ---------- */

export type BudgetLine = { label: string; amount: number };

export type BudgetSummary = {
  income: number;
  totalExpenses: number;
  remaining: number;
  lines: (BudgetLine & { shareOfExpenses: number })[];
};

export function budgetSummary(income: number, expenses: BudgetLine[]): BudgetSummary {
  const totalExpenses = expenses.reduce((sum, line) => sum + line.amount, 0);
  return {
    income,
    totalExpenses,
    remaining: income - totalExpenses,
    lines: expenses.map((line) => ({
      ...line,
      shareOfExpenses: totalExpenses > 0 ? line.amount / totalExpenses : 0,
    })),
  };
}

/* ---------- Tool 3: savings ---------- */

export type SavingsEstimate = {
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
};

export function savingsEstimate(monthlyKwh: number, ratePerKwh: number, reductionPercent: number): SavingsEstimate {
  const currentMonthlyCost = monthlyKwh * ratePerKwh;
  const projectedMonthlyCost = currentMonthlyCost * (1 - reductionPercent / 100);
  const monthlySavings = currentMonthlyCost - projectedMonthlyCost;
  return {
    currentMonthlyCost,
    projectedMonthlyCost,
    monthlySavings,
    annualSavings: monthlySavings * MONTHS_PER_YEAR,
  };
}

/* ---------- Tool 4: usage estimator ---------- */

export type AppliancePreset = { id: string; name: string; watts: number; hoursPerDay: number; note: string };

/** Typical values for comparison only. Real use depends on the model and how it is used. */
export const APPLIANCE_PRESETS: AppliancePreset[] = [
  { id: "fridge", name: "Fridge", watts: 150, hoursPerDay: 8, note: "Cycles on and off; about 8 hours of running a day." },
  { id: "washer", name: "Washing machine", watts: 500, hoursPerDay: 1, note: "One load a day." },
  { id: "dryer", name: "Clothes dryer", watts: 3000, hoursPerDay: 1, note: "One load a day." },
  { id: "tv", name: "TV", watts: 100, hoursPerDay: 4, note: "LED screen." },
  { id: "microwave", name: "Microwave", watts: 1100, hoursPerDay: 0.25, note: "About 15 minutes a day." },
  { id: "heater", name: "Space heater", watts: 1500, hoursPerDay: 3, note: "Portable electric heater." },
  { id: "laptop", name: "Laptop", watts: 60, hoursPerDay: 4, note: "While charging and in use." },
  { id: "led", name: "LED light bulb", watts: 10, hoursPerDay: 5, note: "One bulb." },
];

/** Each item's share of the largest one, for a relative comparison bar (0 to 1). */
export function relativeShares(dailyKwh: number[]): number[] {
  const max = Math.max(0, ...dailyKwh);
  return dailyKwh.map((v) => (max > 0 ? v / max : 0));
}
