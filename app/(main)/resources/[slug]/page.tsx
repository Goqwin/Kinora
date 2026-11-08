import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { ResourceFeedbackForm } from "@/components/resources/resource-feedback-form";
import { SaveResourceButton } from "@/components/resources/save-resource-button";
import { getOptionalUser, isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { isResourceSavedByUser } from "@/lib/db/queries/saved";
import { isResourceStale } from "@/lib/resources/verified";
import {
  categoryLabel,
  getCatalogResourceBySlug,
  getCatalogResourcesSync,
} from "@/lib/resources/catalog";

type ResourceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const instant = false;

export function generateStaticParams() {
  return getCatalogResourcesSync().map((resource) => ({
    slug: resource.slug,
  }));
}

export default async function ResourceDetailPage({
  params,
}: ResourceDetailPageProps) {
  const { slug } = await params;
  const resource = await getCatalogResourceBySlug(slug);
  if (!resource) notFound();

  const outdated = isResourceStale(resource.lastVerifiedAt);
  const authReady = isAuthConfigured();
  const dbReady = isDatabaseConfigured();
  const user = authReady ? await getOptionalUser() : null;
  let initialSaved = false;
  if (user && dbReady && resource.id) {
    try {
      initialSaved = await isResourceSavedByUser(user.id, resource.id);
    } catch {
      initialSaved = false;
    }
  }

  return (
    <PageShell>
      <ScrollToTop />
      <PageHeader eyebrow="Verified resource" title={resource.name}>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="default">Verified</Badge>
          <Badge variant="category">{categoryLabel(resource.category)}</Badge>
          {outdated ? <Badge variant="warning">May be outdated</Badge> : null}
        </div>
      </PageHeader>

      <p className="mt-6 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
        {resource.description}
      </p>

      <section className="mt-8 space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Details
        </h2>
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[var(--ink)]">Address</dt>
            <dd className="mt-1 text-[var(--ink-muted)]">
              {resource.addressLine}, {resource.city} {resource.postalCode}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--ink)]">Phone</dt>
            <dd className="mt-1 text-[var(--ink-muted)]">{resource.phone}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--ink)]">Cost</dt>
            <dd className="mt-1 text-[var(--ink-muted)]">
              {resource.costType}. {resource.costNotes}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--ink)]">Languages</dt>
            <dd className="mt-1 text-[var(--ink-muted)]">
              {resource.languages.join(", ")}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          From parents
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Posts are community opinions, not verified information.
        </p>
        <Button asChild variant="secondary" className="mt-4 rounded-full">
          <Link href={`/community/new?resource=${resource.slug}`}>
            Ask the community
          </Link>
        </Button>
      </section>

      <section className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Eligibility
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          May be eligible. Confirm with the provider.{" "}
          {resource.eligibilitySummary}
        </p>
      </section>

      <section className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Report an issue
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Tell us if this listing may be outdated. This does not change verified
          catalog text automatically.
        </p>
        <ResourceFeedbackForm
          resourceSlug={resource.slug}
          disabled={!dbReady}
        />
      </section>

      <section className="mt-6 text-sm text-[var(--ink-muted)]">
        <p>
          Last verified:{" "}
          <time dateTime={resource.lastVerifiedAt}>
            {resource.lastVerifiedAt}
          </time>
        </p>
        <a
          href={resource.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline"
        >
          View source record
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/resources">Back to catalog</Link>
        </Button>
        <SaveResourceButton
          slug={resource.slug}
          authReady={authReady}
          dbReady={dbReady}
          initialSaved={initialSaved}
        />
      </div>
    </PageShell>
  );
}
