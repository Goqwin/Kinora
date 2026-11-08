import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ResourceCard } from "@/components/resources/resource-card";
import { getCatalogResources } from "@/lib/resources/catalog";
import type { CatalogResource } from "@/lib/resources/types";
import { CRISIS_RESOURCES } from "@/lib/safety/crisis";

const ENERGY_HELP = /\b(utilit(y|ies)|electric(ity)?|energy|power bills?|heating|furnace|gas bills?|bill (help|assistance|payment))\b/i;
const MAX_SHOWN = 3;

export function isEnergyAssistance(resource: Pick<CatalogResource, "name" | "description" | "subcategory">): boolean {
  return ENERGY_HELP.test(`${resource.name} ${resource.subcategory ?? ""} ${resource.description}`);
}

/** Electricity-bill help, only from the verified catalog. Nothing here is generated or typed in by hand. */
export async function EnergyAssistance() {
  let programs: CatalogResource[] = [];
  try {
    programs = (await getCatalogResources({ categories: ["financial"] })).filter(isEnergyAssistance).slice(0, MAX_SHOWN);
  } catch {
    programs = [];
  }
  const helpLine = CRISIS_RESOURCES.find((r) => r.id === "alberta-211");

  return (
    <section aria-labelledby="energy-help-heading" className="mt-12">
      <h3 id="energy-help-heading" className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
        Help with electricity bills
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
        Programs below come from Kinora&apos;s verified catalog, each with its source and the date it was last checked. The
        calculator results above are estimates, not quotes or eligibility decisions.
      </p>

      {programs.length > 0 ? (
        <ul className="mt-6 grid gap-5 lg:grid-cols-3">
          {programs.map((resource) => (
            <li key={resource.slug}>
              <ResourceCard resource={resource} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="font-semibold text-[var(--ink)]">No electricity-bill programs are in the verified catalog yet.</p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              We only list programs we can source and date. Financial supports in the catalog may still help with
              household costs.
            </p>
            <Link
              href="/plan?categories=financial"
              className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              See financial supports
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          {helpLine ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
              <p className="font-semibold text-[var(--ink)]">Ask about local help: {helpLine.name}</p>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {helpLine.detail}. {helpLine.contact}.
              </p>
              {helpLine.href?.startsWith("http") ? (
                <a
                  href={helpLine.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  Visit {helpLine.name}
                  <ExternalLink aria-hidden className="size-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
