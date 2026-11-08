"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { ShownPlan } from "@/app/actions/plan";
import { PageHeader } from "@/components/layout/page-header";
import { PlanResultsWithMap } from "@/components/plan/plan-results-with-map";
import { SavePlanButton } from "@/components/plan/save-plan-button";
import { CrisisCallout } from "@/components/safety/crisis-callout";
import { Button } from "@/components/ui/button";
import { CHILD_AGE_BANDS, type ChildAgeBand } from "@/lib/db/schema-constants";
import { readPlanText } from "@/lib/matching/plan-text-handoff";
import { RESOURCE_CATEGORIES, type ResourceCategory } from "@/lib/resources/types";
import type { SearchPayload } from "@/lib/search/run-search";

type SearchRequest = ReturnType<typeof buildRequest>;
/** A finished request. `key` says which request it answers; any other key means "still loading". */
type Result = { key: string; request: SearchRequest; payload: SearchPayload | null };

const DEFAULT_RADIUS_KM = 15;

/** Filters come from the URL; the free text comes from sessionStorage (never the URL). */
function buildRequest(params: URLSearchParams, text: string) {
  const radius = Number(params.get("radiusKm") ?? DEFAULT_RADIUS_KM);
  const childAgeYears = Number(params.get("childAgeYears") ?? Number.NaN);
  const cost = params.get("costPreference");
  const category = params.get("categories");
  const childAgeBands = params
    .getAll("childAgeBands")
    .filter((v): v is ChildAgeBand => (CHILD_AGE_BANDS as readonly string[]).includes(v));
  const meet = params.get("openToMeetParents");

  return {
    text: text || undefined,
    postal: params.get("postal") ?? undefined,
    radiusKm: Number.isFinite(radius) ? Math.min(50, Math.max(1, radius)) : DEFAULT_RADIUS_KM,
    categories: category ? [category] : undefined,
    childAgeBands: childAgeBands.length > 0 ? childAgeBands : undefined,
    childAgeYears: Number.isFinite(childAgeYears) ? childAgeYears : null,
    costPreference: cost === "free" || cost === "subsidized" ? cost : null,
    openToMeetParents: meet === "1" || meet === "true",
  };
}

export function PlanView({ authReady, dbReady }: { authReady: boolean; dbReady: boolean }) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [attempt, setAttempt] = useState(0);
  const key = `${query}#${attempt}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const request = buildRequest(new URLSearchParams(query), readPlanText(query));
    const controller = new AbortController();
    const finish = (payload: SearchPayload | null) => setResult({ key, request, payload });
    fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then((res) => res.json() as Promise<{ ok: boolean; data?: SearchPayload }>)
      .then((json) => finish(json.ok && json.data ? json.data : null))
      .catch(() => {
        if (!controller.signal.aborted) finish(null);
      });
    return () => controller.abort();
  }, [query, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (!result || result.key !== key) return <PlanSkeleton />;

  const { payload, request } = result;
  if (!payload) {
    return (
      <>
        <PageHeader eyebrow="Support plan" title="My support plan" />
        <div
          className="mt-10 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"
          role="alert"
        >
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            We couldn&apos;t build your plan
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-muted)]">
            Something went wrong on our side. Please try again.
          </p>
          <Button className="mt-6 rounded-full" onClick={retry}>
            Try again
          </Button>
        </div>
      </>
    );
  }

  const empty = payload.results.length === 0;
  const showMeetParentsNudge =
    Boolean(payload.criteria.openToMeetParents) || request.openToMeetParents;
  // Save stores exactly what is on screen: structured data only, never the text.
  const shownPlan: ShownPlan = {
    criteria: {
      categories: payload.criteria.categories.filter((c): c is ResourceCategory =>
        (RESOURCE_CATEGORIES as readonly string[]).includes(c),
      ),
      childAgeBands: payload.criteria.childAgeBands,
      costPreference: payload.criteria.costPreference,
      urgency: payload.criteria.urgency,
      language: payload.criteria.language,
      radiusKm: payload.criteria.radiusKm,
    },
    summary: payload.plan.summary,
    actions: payload.plan.actions,
  };

  return (
    <>
      <PageHeader
        eyebrow="Support plan"
        title="My support plan"
        description={payload.plan.summary}
      />

      {payload.crisis.matched ? <CrisisCallout className="mt-6" signals={payload.crisis.categories} /> : null}

      {payload.aiFallback ? (
        <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Smart matching used keyword cues. Results still come only from the
          verified catalog.
        </p>
      ) : (
        <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--trust-muted)] px-4 py-3 text-sm text-[var(--ink)]">
          Criteria were refined from your message. Resource facts still come
          only from the catalog.
        </p>
      )}

      {showMeetParentsNudge ? (
        <aside className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-xs)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            From parents
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
            Hang out with other single parents
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Your plan may include a peer group if one matches your search. You
            can also ask about coffee, shopping trips, or chore shares on the
            community board. Posts are opinions, not verified information.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-4 rounded-full">
            <Link href="/community">Browse community</Link>
          </Button>
        </aside>
      ) : null}

      {empty ? (
        <div
          className="mt-10 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"
          role="status"
        >
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            No matches in this radius yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-muted)]">
            Try a wider distance, remove a category filter, or browse the full
            catalog.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/">Try another search</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <PlanResultsWithMap
            actions={payload.plan.actions}
            results={payload.results}
            userPoint={
              payload.criteria.userLon !== null && payload.criteria.userLat !== null
                ? [payload.criteria.userLon, payload.criteria.userLat]
                : null
            }
            radiusKm={payload.criteria.radiusKm}
          />
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-start gap-3">
        <SavePlanButton authReady={authReady} dbReady={dbReady} plan={shownPlan} />
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/start">Update my needs</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/resources">Browse full catalog</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/saved">Track my steps</Link>
        </Button>
      </div>
    </>
  );
}

/** Shown while the plan is built (~3 to 6 s) and as the Suspense fallback. */
export function PlanSkeleton() {
  return (
    <>
      <PageHeader eyebrow="Support plan" title="My support plan" />
      <div role="status" aria-live="polite" className="mt-6">
        <p className="text-sm font-medium text-[var(--ink-muted)]">Building your plan…</p>
        <div className="mt-6 grid gap-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-xs)]"
            >
              <div className="h-3 w-24 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-3 h-5 w-2/3 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-3 h-3 w-full rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-2 h-3 w-5/6 rounded-full bg-[var(--surface-muted)]" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
