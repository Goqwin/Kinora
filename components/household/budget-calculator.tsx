"use client";

import { useState } from "react";

import { EstimateNote, NumberField, Stat } from "@/components/household/fields";
import { budgetSummary, formatCad, parseAmount } from "@/lib/household/calculators";
import { cn } from "@/lib/utils";

const EXPENSES = [
  "Rent or mortgage",
  "Electricity",
  "Other utilities",
  "Groceries",
  "Childcare",
  "Transport",
  "Phone and internet",
  "Other",
] as const;

export function BudgetCalculator() {
  const [income, setIncome] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const parsedIncome = parseAmount(income);
  const parsedExpenses = EXPENSES.map((label) => ({ label, parsed: parseAmount(amounts[label] ?? "") }));
  const summary = budgetSummary(
    parsedIncome.value ?? 0,
    parsedExpenses.map(({ label, parsed }) => ({ label, amount: parsed.value ?? 0 })),
  );
  const filledLines = summary.lines.filter((line) => line.amount > 0);
  const hasInput = parsedIncome.value !== null || filledLines.length > 0;
  const short = summary.remaining < 0;

  return (
    <div className="flex flex-col gap-6">
      <NumberField
        label="Monthly income after tax"
        value={income}
        onChange={setIncome}
        parsed={parsedIncome}
        prefix="$"
        hint="Include wages, benefits and support payments."
        className="max-w-xs"
      />

      <fieldset>
        <legend className="text-sm font-semibold text-[var(--ink)]">Monthly expenses</legend>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">Leave a line empty if it does not apply.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {parsedExpenses.map(({ label, parsed }) => (
            <NumberField
              key={label}
              label={label}
              value={amounts[label] ?? ""}
              onChange={(value) => setAmounts((current) => ({ ...current, [label]: value }))}
              parsed={parsed}
              prefix="$"
            />
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="budget-summary" aria-live="polite" className="flex flex-col gap-4">
        <h3 id="budget-summary" className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Your month at a glance
        </h3>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat label="Income" value={formatCad(summary.income)} />
          <Stat label="Total expenses" value={formatCad(summary.totalExpenses)} />
          <div
            className={cn(
              "rounded-[var(--radius-md)] border p-4",
              short ? "border-[var(--crisis-border)] bg-[var(--crisis-bg)]" : "border-[var(--border)] bg-[var(--lime-soft)]",
            )}
          >
            <dt className="text-sm text-[var(--ink-muted)]">{short ? "Short by" : "Left over"}</dt>
            <dd className={cn("mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold", short ? "text-[var(--crisis-fg)]" : "text-[var(--ink)]")}>
              {formatCad(Math.abs(summary.remaining))}
            </dd>
          </div>
        </dl>

        {filledLines.length > 0 ? (
          <figure>
            <figcaption className="text-sm font-semibold text-[var(--ink)]">Where the money goes</figcaption>
            <ul className="mt-3 flex flex-col gap-3">
              {filledLines.map((line) => (
                <li key={line.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-[var(--ink)]">{line.label}</span>
                    <span className="tabular-nums text-[var(--ink-muted)]">
                      {formatCad(line.amount)} · {Math.round(line.shareOfExpenses * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-[var(--surface-muted)]" aria-hidden>
                    <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${Math.max(2, line.shareOfExpenses * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </figure>
        ) : hasInput ? null : (
          <p className="text-sm text-[var(--ink-muted)]">Add your income and a few expenses to see your breakdown.</p>
        )}
      </section>

      <EstimateNote>Nothing you enter here is saved or sent anywhere. It stays in this browser tab.</EstimateNote>
    </div>
  );
}
