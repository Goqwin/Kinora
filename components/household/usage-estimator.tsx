"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { EstimateNote, NumberField } from "@/components/household/fields";
import {
  APPLIANCE_PRESETS,
  applianceUsage,
  formatCad,
  formatKwh,
  parseAmount,
  parseHours,
  relativeShares,
} from "@/lib/household/calculators";

type Values = Record<string, { watts: string; hours: string }>;

const defaults = (): Values =>
  Object.fromEntries(APPLIANCE_PRESETS.map((p) => [p.id, { watts: String(p.watts), hours: String(p.hoursPerDay) }]));

export function UsageEstimator() {
  const [rate, setRate] = useState("0.20");
  const [values, setValues] = useState<Values>(defaults);

  const parsedRate = parseAmount(rate);
  const rows = APPLIANCE_PRESETS.map((preset) => {
    const watts = parseAmount(values[preset.id].watts);
    const hours = parseHours(values[preset.id].hours);
    const usage =
      watts.value !== null && hours.value !== null
        ? applianceUsage({ watts: watts.value, hoursPerDay: hours.value }, parsedRate.value ?? 0)
        : null;
    return { preset, watts, hours, usage };
  });
  const shares = relativeShares(rows.map((r) => r.usage?.dailyKwh ?? 0));
  const update = (id: string, patch: Partial<Values[string]>) =>
    setValues((current) => ({ ...current, [id]: { ...current[id], ...patch } }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <NumberField label="Electricity rate" value={rate} onChange={setRate} parsed={parsedRate} prefix="$" suffix="per kWh" hint="Example rate. Check your bill." className="max-w-xs" />
        <button
          type="button"
          onClick={() => setValues(defaults())}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <RotateCcw aria-hidden className="size-4" />
          Reset to typical values
        </button>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {rows.map(({ preset, watts, hours, usage }, i) => (
          <li key={preset.id} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">{preset.name}</h3>
            <p className="text-xs text-[var(--ink-muted)]">{preset.note}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="Power" value={values[preset.id].watts} onChange={(v) => update(preset.id, { watts: v })} parsed={watts} suffix="W" />
              <NumberField label="Hours a day" value={values[preset.id].hours} onChange={(v) => update(preset.id, { hours: v })} parsed={hours} suffix="h" />
            </div>
            <p className="mt-3 text-sm text-[var(--ink)]">
              {usage
                ? `${formatKwh(usage.dailyKwh)} a day · about ${formatCad(usage.monthlyCost)} a month`
                : "Enter power and hours to compare."}
            </p>
            <div className="mt-2 h-2.5 rounded-full bg-[var(--surface)]" aria-hidden>
              <div className="h-full rounded-full bg-[var(--series-2)]" style={{ width: `${shares[i] * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <EstimateNote>
        Typical values for comparison only. Check the label on your appliance for its real wattage. The bar shows each item
        compared with the one that uses the most.
      </EstimateNote>
    </div>
  );
}
