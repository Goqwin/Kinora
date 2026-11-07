import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { StartIntakeForm } from "@/components/start/start-intake-form";

type StartPageInnerProps = {
  searchParams: Promise<{ mode?: string }>;
};

export async function StartPageInner({ searchParams }: StartPageInnerProps) {
  const params = await searchParams;
  const mode = params.mode === "needs" ? "needs" : "nearby";

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Filters"
        title={
          mode === "needs" ? "Tell us what you need" : "Find support near you"
        }
        description="Share your area or what you need. We build a support plan from verified catalog data. Sign in only when you want to save."
      />
      <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] sm:p-8">
        <StartIntakeForm key={mode} defaultMode={mode} />
      </div>
    </PageShell>
  );
}
