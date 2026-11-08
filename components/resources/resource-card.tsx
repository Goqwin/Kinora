import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/resources/category-labels";
import type { CatalogResource } from "@/lib/resources/types";
import { isResourceStale } from "@/lib/resources/verified";
import { cn } from "@/lib/utils";

type ResourceCardProps = {
  resource: CatalogResource;
  className?: string;
};

export function ResourceCard({ resource, className }: ResourceCardProps) {
  const outdated = isResourceStale(resource.lastVerifiedAt);

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">Verified</Badge>
        <Badge variant="category">{categoryLabel(resource.category)}</Badge>
        {outdated ? <Badge variant="warning">May be outdated</Badge> : null}
      </div>

      <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--ink)]">
        <Link
          href={`/resources/${resource.slug}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {resource.name}
        </Link>
      </h2>

      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--ink-muted)]">
        {resource.description}
      </p>

      <p className="mt-4 text-sm text-[var(--ink-muted)]">
        <span className="font-medium text-[var(--ink)]">Eligibility: </span>
        May be eligible. Confirm with the provider.
      </p>

      <Link
        href={`/resources/${resource.slug}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
      >
        View details
        <ArrowUpRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </Link>
    </article>
  );
}
