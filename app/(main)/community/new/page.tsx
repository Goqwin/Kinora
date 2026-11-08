import Link from "next/link";

import { CommunityPostForm } from "@/components/community/community-post-form";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { isDatabaseConfigured } from "@/lib/db";

type CommunityNewPageProps = {
  searchParams: Promise<{ resource?: string }>;
};

export const metadata = {
  title: "New community post",
};

export default async function CommunityNewPage({
  searchParams,
}: CommunityNewPageProps) {
  const params = await searchParams;
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
        <CommunityPostForm resourceSlug={params.resource} disabled={!dbReady} />
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
