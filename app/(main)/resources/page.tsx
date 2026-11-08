import { Suspense } from "react";

import { ListSkeleton } from "@/components/layout/list-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { ResourcesCatalogWithMap } from "@/components/resources/resources-catalog-with-map";
import { getCatalogResources } from "@/lib/resources/catalog";

export const metadata = {
  title: "Resources",
};

export default function ResourcesPage() {
  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Verified catalog"
        title="Browse supports"
        description="Each listing includes a source link and last verified date. May be eligible. Confirm with the provider."
      />
      <Suspense fallback={<ListSkeleton />}>
        <ResourcesCatalog />
      </Suspense>
    </PageShell>
  );
}

async function ResourcesCatalog() {
  const resources = await getCatalogResources();

  return resources.length === 0 ? (
        <p
          className="mt-10 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center text-[var(--ink-muted)]"
          role="status"
        >
          No resources yet. Run `pnpm db:migrate` and `pnpm db:seed` when
          DATABASE_URL is configured.
        </p>
      ) : (
        <div className="mt-10">
          <ResourcesCatalogWithMap resources={resources} />
        </div>
      );
}
