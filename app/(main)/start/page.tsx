import { Suspense } from "react";

import { StartPageInner } from "@/app/(main)/start/start-page-inner";

type StartPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

function StartPageFallback() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />
        <div className="h-4 w-full rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />
        <div className="mt-8 h-64 rounded-[var(--radius-lg)] bg-[var(--surface-muted)]" />
      </div>
    </main>
  );
}

export default function StartPage({ searchParams }: StartPageProps) {
  return (
    <Suspense fallback={<StartPageFallback />}>
      <StartPageInner searchParams={searchParams} />
    </Suspense>
  );
}
