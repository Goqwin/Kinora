import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { ResourcesCatalogWithMap } from "@/components/resources/resources-catalog-with-map";
import { getCatalogResources } from "@/lib/resources/catalog";

export const metadata = {
  title: "Resources",
};

export default async function ResourcesPage() {
  const resources = await getCatalogResources();

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Verified catalog"
        title="Browse supports"
        description="Each listing includes a source link and last verified date. Eligibility is always potentially eligible until a provider confirms."
      />
      {resources.length === 0 ? (
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
      )}
    </PageShell>
  );
}
