import Link from "next/link";

import { SavePlanButton } from "@/components/plan/save-plan-button";
import { PlanResultsWithMap } from "@/components/plan/plan-results-with-map";
import { CrisisCallout } from "@/components/safety/crisis-callout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  CHILD_AGE_BANDS,
  type ChildAgeBand,
} from "@/lib/db/schema-constants";
import { runSearch } from "@/lib/search/run-search";

export const metadata = {
  title: "My support plan",
};

type PlanPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function allParams(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseAgeBands(
  value: string | string[] | undefined,
): ChildAgeBand[] {
  return allParams(value).filter((v): v is ChildAgeBand =>
    (CHILD_AGE_BANDS as readonly string[]).includes(v),
  );
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const text = firstParam(params.text);
  const postal = firstParam(params.postal);
  const radiusKm = Number(firstParam(params.radiusKm) ?? 15);
  const categoriesRaw = firstParam(params.categories);
  const childAgeBands = parseAgeBands(params.childAgeBands);
  const childAgeYears = firstParam(params.childAgeYears);
  const costPreference = firstParam(params.costPreference);
  const openToMeetParents =
    firstParam(params.openToMeetParents) === "1" ||
    firstParam(params.openToMeetParents) === "true";

  const payload = await runSearch({
    text,
    postal,
    radiusKm: Number.isFinite(radiusKm) ? radiusKm : 15,
    categories: categoriesRaw ? [categoriesRaw] : undefined,
    childAgeBands: childAgeBands.length > 0 ? childAgeBands : undefined,
    childAgeYears: childAgeYears ? Number(childAgeYears) : null,
    costPreference:
      costPreference === "free" || costPreference === "subsidized"
        ? costPreference
        : null,
    openToMeetParents,
  });

  const empty = payload.results.length === 0;
  const authReady = isAuthConfigured();
  const dbReady = isDatabaseConfigured();
  const showMeetParentsNudge =
    Boolean(payload.criteria.openToMeetParents) || openToMeetParents;
  const savePlanParams = {
    text,
    postal,
    radiusKm: firstParam(params.radiusKm),
    categories: categoriesRaw,
    childAgeYears,
    costPreference,
  };

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Support plan"
        title="My support plan"
        description={payload.plan.summary}
      />

      {payload.crisis.matched ? (
        <CrisisCallout className="mt-6" />
      ) : null}

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
            Looking to connect with similar parents?
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Community posts are opinions, not verified information. You can ask
            about chore shares, isolation, or local parent tips there.
          </p>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="mt-4 rounded-full"
          >
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
              payload.criteria.userLon !== null &&
              payload.criteria.userLat !== null
                ? [payload.criteria.userLon, payload.criteria.userLat]
                : null
            }
            radiusKm={payload.criteria.radiusKm}
          />
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-start gap-3">
        <SavePlanButton
          authReady={authReady}
          dbReady={dbReady}
          searchParams={savePlanParams}
        />
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/start">Update my needs</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/resources">Browse full catalog</Link>
        </Button>
      </div>
    </PageShell>
  );
}
