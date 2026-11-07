"use client";

import { useState } from "react";

import { LazyResourceMap } from "@/components/map/LazyResourceMap";
import { PlanResultList } from "@/components/plan/plan-result-list";
import type { PlanAction } from "@/lib/matching/plan";
import type { ScoredResource } from "@/lib/matching/score";
import type { LngLat } from "@/lib/mapbox/radius";

type PlanResultsWithMapProps = {
  actions: PlanAction[];
  results: ScoredResource[];
  userPoint: LngLat | null;
  radiusKm: number;
};

export function PlanResultsWithMap({
  actions,
  results,
  userPoint,
  radiusKm,
}: PlanResultsWithMapProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    results[0]?.slug ?? null,
  );

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
      <div className="min-w-0 lg:order-1">
        <PlanResultList
          actions={actions}
          results={results}
          selectedSlug={selectedSlug}
          onSelectResult={setSelectedSlug}
        />
      </div>
      <div className="lg:sticky lg:top-20 lg:order-2 lg:self-start">
        <LazyResourceMap
          resources={results}
          selectedId={selectedSlug}
          onSelect={setSelectedSlug}
          userPoint={userPoint}
          radiusKm={radiusKm}
        />
      </div>
    </div>
  );
}
