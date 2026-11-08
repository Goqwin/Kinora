"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { LazyResourceMap } from "@/components/map/LazyResourceMap";
import { ResourceCard } from "@/components/resources/resource-card";
import type { CatalogResource } from "@/lib/resources/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

type ResourcesCatalogWithMapProps = {
  resources: CatalogResource[];
};

/** Page numbers to show: always first and last, plus the current page's neighbours. */
function visiblePages(current: number, total: number): (number | "gap")[] {
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? ["gap" as const, page] : [page]));
}

export function ResourcesCatalogWithMap({ resources }: ResourcesCatalogWithMapProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(resources[0]?.slug ?? null);

  const pageCount = Math.max(1, Math.ceil(resources.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageItems = useMemo(
    () => resources.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE),
    [resources, current],
  );
  const focusSlug = pageItems.some((r) => r.slug === selectedSlug) ? selectedSlug : (pageItems[0]?.slug ?? null);

  function goTo(next: number) {
    const target = Math.max(0, Math.min(next, pageCount - 1));
    setPage(target);
    setSelectedSlug(resources[target * PAGE_SIZE]?.slug ?? null);
    listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const first = current * PAGE_SIZE + 1;
  const last = current * PAGE_SIZE + pageItems.length;

  return (
    <div ref={listRef} className="scroll-mt-24">
      <p className="mb-4 text-sm text-[var(--ink-muted)]" role="status" aria-live="polite">
        Showing {first}–{last} of {resources.length} resources
      </p>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div>
        <ul className="grid gap-5">
          {pageItems.map((resource) => (
            <li key={resource.slug}>
              <div
                className={
                  focusSlug === resource.slug
                    ? "rounded-3xl ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--canvas)]"
                    : undefined
                }
                onMouseEnter={() => setSelectedSlug(resource.slug)}
                onFocus={() => setSelectedSlug(resource.slug)}
              >
                <ResourceCard resource={resource} />
              </div>
            </li>
          ))}
        </ul>

        {pageCount > 1 ? (
          <nav aria-label="Resource pages" className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeft aria-hidden className="size-4" />
              Previous
            </button>
            <ol className="flex flex-wrap items-center gap-1">
              {visiblePages(current, pageCount).map((item, i) =>
                item === "gap" ? (
                  <li key={`gap-${i}`} aria-hidden className="px-1 text-[var(--ink-muted)]">
                    …
                  </li>
                ) : (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => goTo(item)}
                      aria-current={item === current ? "page" : undefined}
                      aria-label={`Page ${item + 1}`}
                      className={cn(
                        "grid size-11 place-items-center rounded-full text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                        item === current
                          ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                          : "text-[var(--ink)] hover:bg-[var(--surface-muted)]",
                      )}
                    >
                      {item + 1}
                    </button>
                  </li>
                ),
              )}
            </ol>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current === pageCount - 1}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50"
            >
              Next
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </nav>
        ) : null}
      </div>
      <div className="lg:sticky lg:top-24">
        <LazyResourceMap
          resources={pageItems}
          selectedId={focusSlug}
          onSelect={setSelectedSlug}
          userPoint={null}
          radiusKm={25}
        />
      </div>
      </div>
    </div>
  );
}
