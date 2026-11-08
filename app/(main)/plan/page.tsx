import { Suspense } from "react";

import { PageShell } from "@/components/layout/page-shell";
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
    </PageShell>
  );
}
