import { Suspense } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { HouseholdTools } from "@/components/household/household-tools";
import { PlanSkeleton, PlanView } from "@/components/plan/plan-view";
import { isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata = {
  title: "My support plan",
};

/**
 * The plan is built in the browser: PlanView POSTs the filters (from the URL)
 * and the parent's free text (from sessionStorage, never the URL) to
 * /api/search. Nothing here reads request data, so the page shell prerenders;
 * the Suspense boundary covers useSearchParams in PlanView.
 */
export default function PlanPage() {
  return (
    <PageShell width="wide">
      <Suspense fallback={<PlanSkeleton />}>
        <PlanView authReady={isAuthConfigured()} dbReady={isDatabaseConfigured()} />
      </Suspense>

      <section
        aria-labelledby="household-tools-heading"
        className="mt-16 border-t border-[var(--border)] pt-12 sm:mt-20 sm:pt-16"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Household tools
        </p>
        <h2
          id="household-tools-heading"
          className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl"
        >
          Make household costs easier to manage.
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Understand your household expenses, estimate electricity usage, and
          discover practical ways to save.
        </p>
        <HouseholdTools />
      </section>
    </PageShell>
  );
}
