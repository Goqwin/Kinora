"use client";

import { useState } from "react";

import { EstimateNote, NumberField, Stat } from "@/components/household/fields";
import { formatCad, parseAmount, parsePercent, savingsEstimate } from "@/lib/household/calculators";

const TIPS = [
  "Switch the bulbs you use most to LED.",
  "Wash clothes in cold water and air-dry when you can.",
  "Turn space heaters off when you leave the room.",
  "Unplug chargers and electronics that stay on standby.",
];

export function SavingsCalculator() {
  const [monthlyKwh, setMonthlyKwh] = useState("600");
  const [rate, setRate] = useState("0.20");
  const [reduction, setReduction] = useState("10");

  const parsedKwh = parseAmount(monthlyKwh);
  const parsedRate = parseAmount(rate);
  const parsedReduction = parsePercent(reduction);
  const ready = parsedKwh.value !== null && parsedRate.value !== null && parsedReduction.value !== null;
  const estimate = ready
    ? savingsEstimate(parsedKwh.value ?? 0, parsedRate.value ?? 0, parsedReduction.value ?? 0)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          label="Current monthly use"
          value={monthlyKwh}
          onChange={setMonthlyKwh}
          parsed={parsedKwh}
          suffix="kWh"
          hint="Found on your electricity bill."
        />
        <NumberField label="Electricity rate" value={rate} onChange={setRate} parsed={parsedRate} prefix="$" suffix="per kWh" hint="Example rate. Check your bill." />
        <NumberField label="Expected reduction" value={reduction} onChange={setReduction} parsed={parsedReduction} suffix="%" hint="How much less you hope to use." />
      </div>

      <section aria-labelledby="savings-result" aria-live="polite">
        <h3 id="savings-result" className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Estimated savings
        </h3>
        {estimate ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Current monthly cost (estimate)" value={formatCad(estimate.currentMonthlyCost)} />
            <Stat label="Projected monthly cost (estimate)" value={formatCad(estimate.projectedMonthlyCost)} />
            <Stat label="Possible monthly savings (estimate)" value={formatCad(estimate.monthlySavings)} emphasis />
            <Stat label="Possible annual savings (estimate)" value={formatCad(estimate.annualSavings)} emphasis />
          </dl>
        ) : (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">Fill in all three fields to see an estimate.</p>
        )}
      </section>

      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">Practical ways to use less</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--ink)]">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <EstimateNote>
        These are estimates, not a quote. Actual savings depend on your usage, your rate and the fixed charges on your bill.
      </EstimateNote>
    </div>
  );
}
