import Link from "next/link";
import { Suspense } from "react";

import { CommunityPostForm } from "@/components/community/community-post-form";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { isDatabaseConfigured } from "@/lib/db";

type CommunityNewSearchParams = Promise<{ resource?: string }>;

type CommunityNewPageProps = {
  searchParams: CommunityNewSearchParams;
};

export const metadata = {
  title: "New community post",
};

/** The only part that needs the URL: which resource (if any) the post is about. */
async function PostFormFromUrl({
  searchParams,
  disabled,
}: {
  searchParams: CommunityNewSearchParams;
  disabled: boolean;
}) {
  const { resource } = await searchParams;
  return <CommunityPostForm resourceSlug={resource} disabled={disabled} />;
}

/** Same fields and spacing as CommunityPostForm, shown while the URL is read. */
function PostFormSkeleton() {
  const bar = "rounded-[var(--radius-md)] bg-[var(--surface-muted)]";
  return (
    <div className="animate-pulse space-y-5" role="status" aria-label="Loading the form">
      {["h-11", "h-11", "h-36"].map((height, i) => (
        <div key={i} className="space-y-2">
          <div className={`h-4 w-28 ${bar}`} />
          <div className={`${height} w-full ${bar}`} />
        </div>
      ))}
      <div className="h-10 w-40 rounded-[var(--radius-pill)] bg-[var(--surface-muted)]" />
      <div className={`h-3 w-64 ${bar}`} />
    </div>
  );
}

export default function CommunityNewPage({ searchParams }: CommunityNewPageProps) {
  const dbReady = isDatabaseConfigured();

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="From parents"
        title="Ask other parents"
        description="Posts are community opinions, not verified information. Do not include emails, phone numbers, or street addresses."
      />

      {!dbReady ? (
        <p className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--warn-muted)] px-4 py-3 text-sm text-[var(--warn-fg)]">
          DATABASE_URL is not set. You can preview the form, but posts cannot be
          saved until Postgres is connected.
        </p>
      ) : null}

      <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
        <Suspense fallback={<PostFormSkeleton />}>
          <PostFormFromUrl searchParams={searchParams} disabled={!dbReady} />
        </Suspense>
      </div>

      <p className="mt-8 text-sm">
        <Link
          href="/community"
          className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
        >
          Back to community board
        </Link>
      </p>
    </PageShell>
  );
}
