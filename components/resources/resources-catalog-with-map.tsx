"use client";

import { useMemo, useState } from "react";

import { LazyResourceMap } from "@/components/map/LazyResourceMap";
import { ResourceCard } from "@/components/resource/resource-card";
import type { CatalogResource } from "@/lib/resources/types";

type ResourcesCatalogWithMapProps = {
  resources: CatalogResource[];
};

export function ResourcesCatalogWithMap({
  resources,
}: ResourcesCatalogWithMapProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    resources[0]?.slug ?? null,
  );

  const focusSlug = selectedSlug ?? resources[0]?.slug ?? null;

  const list = useMemo(() => resources, [resources]);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <ul className="grid gap-5">
        {list.map((resource) => (
          <li key={resource.slug}>
            <div
              className={
                focusSlug === resource.slug
                  ? "rounded-3xl ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--canvas)]"
                  : undefined
              }
              onMouseEnter={() => setSelectedSlug(resource.slug)}
              onFocus={() => setSelectedSlug(resource.slug)}
            >
              <ResourceCard resource={resource} />
            </div>
          </li>
        ))}
      </ul>
      <div className="lg:sticky lg:top-20">
        <LazyResourceMap
          resources={list}
          selectedId={focusSlug}
          onSelect={setSelectedSlug}
          userPoint={null}
          radiusKm={25}
        />
      </div>
    </div>
  );
}
