"use client";

import { useState } from "react";

import { LazyResourceMap } from "@/components/map/LazyResourceMap";
import { RankedMatches, SupportPlanSteps } from "@/components/plan/plan-result-list";
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
    <div className="mt-10 space-y-12">
      <div className="max-w-4xl">
        <SupportPlanSteps actions={actions} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <LazyResourceMap
            resources={results}
            selectedId={selectedSlug}
            onSelect={setSelectedSlug}
            userPoint={userPoint}
            radiusKm={radiusKm}
          />
        </div>
        <div className="min-w-0">
          <RankedMatches results={results} selectedSlug={selectedSlug} onSelectResult={setSelectedSlug} />
        </div>
      </div>
    </div>
  );
}
