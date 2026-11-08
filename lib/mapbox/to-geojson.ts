import type { Feature, FeatureCollection, Point } from "geojson";

import type { CatalogResource } from "@/lib/resources/types";

export function resourcesToGeoJson(
  resources: Pick<
    CatalogResource,
    "slug" | "name" | "category" | "longitude" | "latitude"
  >[],
): FeatureCollection<Point> {
  const features: Feature<Point>[] = resources
    .filter(
      (r) =>
        Number.isFinite(r.longitude) &&
        Number.isFinite(r.latitude) &&
        !(r.longitude === 0 && r.latitude === 0),
    )
    .map((r) => ({
      type: "Feature",
      id: r.slug,
      properties: {
        id: r.slug,
        name: r.name,
        category: r.category,
      },
      geometry: {
        type: "Point",
        coordinates: [r.longitude, r.latitude],
      },
    }));

  return { type: "FeatureCollection", features };
}
