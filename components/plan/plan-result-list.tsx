import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { PlanAction } from "@/lib/matching/plan";
import type { ScoredResource } from "@/lib/matching/score";
import { categoryLabel } from "@/lib/resources/category-labels";
import { cn } from "@/lib/utils";

type PlanResultListProps = {
  actions: PlanAction[];
  results: ScoredResource[];
  selectedSlug?: string | null;
  onSelectResult?: (slug: string) => void;
};

export function PlanResultList({
  actions,
  results,
  selectedSlug,
  onSelectResult,
}: PlanResultListProps) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Your support plan
        </h2>
        <ol className="mt-6 space-y-4">
          {actions.map((action) => (
            <li
              key={action.resourceSlug}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Step {action.priority}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                {action.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {action.reason}
              </p>
              <p className="mt-3 text-sm text-[var(--ink)]">
                <span className="font-medium">First step: </span>
                {action.firstStep}
              </p>
              <Link
                href={`/resources/${action.resourceSlug}`}
                className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Open resource details
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
          Ranked matches
        </h2>
        <ul className="mt-4 space-y-2">
          {results.map((row, index) => (
            <li key={row.slug}>
              <div
                className={cn(
                  "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-left transition",
                  "hover:border-[var(--border-strong)] focus-within:ring-2 focus-within:ring-[var(--ring)]",
                  selectedSlug === row.slug &&
                    "border-[var(--accent)] bg-[var(--surface-muted)]",
                )}
                onMouseEnter={() => onSelectResult?.(row.slug)}
                onFocus={() => onSelectResult?.(row.slug)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--ink-muted)]">
                    #{index + 1}
                  </span>
                  <Badge variant="category">
                    {categoryLabel(row.category)}
                  </Badge>
                  {typeof row.distanceKm === "number" ? (
                    <span className="text-xs text-[var(--ink-muted)]">
                      {row.distanceKm.toFixed(1)} km
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/resources/${row.slug}`}
                  className="mt-2 block font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)] hover:text-[var(--accent)] focus-visible:outline-none"
                >
                  {row.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Score {Math.round(row.score)}. May be eligible. Confirm with the provider.{" "}
                  {row.eligibilitySummary}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
