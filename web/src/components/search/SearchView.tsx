"use client";

import { useState } from "react";
import { LazyResourceMap } from "@/components/map/LazyResourceMap";
import { ResourceList } from "@/components/resources/ResourceList";
import type { LngLat, Resource } from "@/types/resource";

type Props = { resources: Resource[]; userPoint: LngLat | null; radiusKm: number };

export function SearchView({ resources, userPoint, radiusKm }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-[50vh] lg:sticky lg:top-4 lg:order-2 lg:h-[calc(100vh-2rem)]">
        <LazyResourceMap resources={resources} selectedId={selectedId} onSelect={setSelectedId} userPoint={userPoint} radiusKm={radiusKm} />
      </div>
      <ResourceList resources={resources} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}
