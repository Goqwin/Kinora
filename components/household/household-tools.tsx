"use client";

import { Calculator, Gauge, PiggyBank, Zap, type LucideIcon } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

import { BudgetCalculator } from "@/components/household/budget-calculator";
import { ElectricityCalculator } from "@/components/household/electricity-calculator";
import { SavingsCalculator } from "@/components/household/savings-calculator";
import { UsageEstimator } from "@/components/household/usage-estimator";
import { cn } from "@/lib/utils";

type Tool = { id: string; label: string; icon: LucideIcon; Panel: () => React.ReactElement };

const TOOLS: Tool[] = [
  { id: "electricity", label: "Electricity cost", icon: Zap, Panel: ElectricityCalculator },
  { id: "budget", label: "Household budget", icon: Calculator, Panel: BudgetCalculator },
  { id: "savings", label: "Savings", icon: PiggyBank, Panel: SavingsCalculator },
  { id: "usage", label: "Energy usage", icon: Gauge, Panel: UsageEstimator },
];

/** WAI-ARIA tabs. Every panel stays mounted, so switching tabs never loses what was typed. */
export function HouseholdTools() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = TOOLS.length - 1;
    const next =
      event.key === "ArrowRight" ? (active === last ? 0 : active + 1)
      : event.key === "ArrowLeft" ? (active === 0 ? last : active - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Household tools" onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          const selected = i === active;
          return (
            <button
              key={tool.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tool-tab-${tool.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`tool-panel-${tool.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)]",
                selected
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-muted)]",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {tool.label}
            </button>
          );
        })}
      </div>

      {TOOLS.map(({ id, Panel }, i) => (
        <div
          key={id}
          id={`tool-panel-${id}`}
          role="tabpanel"
          aria-labelledby={`tool-tab-${id}`}
          hidden={i !== active}
          tabIndex={0}
          className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:p-7"
        >
          <Panel />
        </div>
      ))}
    </div>
  );
}
