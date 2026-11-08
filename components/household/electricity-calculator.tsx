"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { EstimateNote, NumberField, Stat } from "@/components/household/fields";
import {
  applianceUsage,
  combinedUsage,
  formatCad,
  formatKwh,
  parseAmount,
  parseHours,
} from "@/lib/household/calculators";

type Row = { id: number; name: string; watts: string; hours: string };

let nextId = 3;

export function ElectricityCalculator() {
  const [rate, setRate] = useState("0.20");
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: "Space heater", watts: "1500", hours: "3" },
    { id: 2, name: "Fridge", watts: "150", hours: "8" },
  ]);

  const parsedRate = parseAmount(rate);
  const ratePerKwh = parsedRate.value ?? 0;

  const parsedRows = rows.map((row) => {
    const watts = parseAmount(row.watts);
    const hours = parseHours(row.hours);
    const complete = watts.value !== null && hours.value !== null;
    return { row, watts, hours, complete };
  });
  const counted = parsedRows.filter((r) => r.complete);
  const total = combinedUsage(
    counted.map((r) => ({ watts: r.watts.value ?? 0, hoursPerDay: r.hours.value ?? 0 })),
    ratePerKwh,
  );
  const notCounted = rows.length - counted.length;

  const update = (id: number, patch: Partial<Row>) =>
    setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-6">
      <NumberField
        label="Electricity rate"
        value={rate}
        onChange={setRate}
        parsed={parsedRate}
        prefix="$"
        suffix="per kWh"
        hint="Example rate. Use the energy charge per kWh from your own bill."
        className="max-w-xs"
      />

      <ul className="flex flex-col gap-4">
        {parsedRows.map(({ row, watts, hours, complete }, index) => {
          const usage = complete ? applianceUsage({ watts: watts.value ?? 0, hoursPerDay: hours.value ?? 0 }, ratePerKwh) : null;
          const name = row.name.trim() || `Appliance ${index + 1}`;
          return (
            <li key={row.id} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`appliance-${row.id}`} className="text-sm font-semibold text-[var(--ink)]">
                    Appliance name
                  </label>
                  <input
                    id={`appliance-${row.id}`}
                    value={row.name}
                    maxLength={60}
                    onChange={(event) => update(row.id, { name: event.target.value })}
                    className="min-h-11 rounded-[var(--radius-md)] border border-[var(--border-strong)]/40 bg-[var(--surface)] px-3 text-base text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                <NumberField label="Power" value={row.watts} onChange={(v) => update(row.id, { watts: v })} parsed={watts} suffix="W" />
                <NumberField label="Use per day" value={row.hours} onChange={(v) => update(row.id, { hours: v })} parsed={hours} suffix="hours" />
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((r) => r.id !== row.id))}
                  aria-label={`Remove ${name}`}
                  className="grid size-11 place-items-center self-end rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <Trash2 aria-hidden className="size-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-muted)]">
                {usage
                  ? `${formatKwh(usage.dailyKwh)} a day · ${formatCad(usage.monthlyCost)} a month`
                  : "Enter power and hours to include this appliance."}
              </p>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setRows((current) => [...current, { id: nextId++, name: "", watts: "", hours: "" }])}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <Plus aria-hidden className="size-4" />
        Add appliance
      </button>

      <section aria-labelledby="electricity-total" aria-live="polite">
        <h3 id="electricity-total" className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Combined total{counted.length ? ` for ${counted.length} appliance${counted.length === 1 ? "" : "s"}` : ""}
        </h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Daily use" value={formatKwh(total.dailyKwh)} />
          <Stat label="Monthly use" value={formatKwh(total.monthlyKwh)} />
          <Stat label="Daily cost" value={formatCad(total.dailyCost)} />
          <Stat label="Monthly cost" value={formatCad(total.monthlyCost)} emphasis />
          <Stat label="Annual cost" value={formatCad(total.annualCost)} />
        </dl>
        {notCounted > 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            {notCounted} appliance{notCounted === 1 ? " is" : "s are"} not counted until power and hours are filled in.
          </p>
        ) : null}
      </section>

      <EstimateNote>
        Estimates only. Monthly figures use 30 days and annual figures use 365 days. Your bill also includes delivery
        charges, fees and taxes that this does not include.
      </EstimateNote>
    </div>
  );
}
