import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

export type LngLat = [longitude: number, latitude: number];

export const EMPTY_COLLECTION: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function kmPerDegreeLat(): number {
  return 111.32;
}

function kmPerDegreeLon(lat: number): number {
  return 111.32 * Math.cos((lat * Math.PI) / 180);
}

/** Simple circle polygon for radius display (not survey-grade). */
export function radiusArea(center: LngLat, radiusKm: number, steps = 64): FeatureCollection {
  const [lon, lat] = center;
  const coords: [number, number][] = [];
  const latKm = kmPerDegreeLat();
  const lonKm = kmPerDegreeLon(lat);

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLon = (radiusKm / lonKm) * Math.cos(angle);
    const dLat = (radiusKm / latKm) * Math.sin(angle);
    coords.push([lon + dLon, lat + dLat]);
  }

  const ring = coords as [number, number][];
  const polygon: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  };
  const point: Feature<Point> = {
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: center },
  };

  return { type: "FeatureCollection", features: [polygon, point] };
}
