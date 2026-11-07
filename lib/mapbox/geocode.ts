import { approximateFromPostal, roundCoord } from "@/lib/geo";
import { getEnv } from "@/lib/env";

import type { LngLat } from "./radius";

/**
 * Geocode a Canadian postal FSA using Mapbox when MAPBOX_TOKEN is set;
 * otherwise fall back to the local FSA approximation used for search.
 */
export async function geocodePostalFsa(
  postal: string,
): Promise<LngLat | null> {
  const cleaned = postal.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length < 3) return null;
  const query = `${cleaned.slice(0, 3)} Calgary AB Canada`;
  const token = getEnv().MAPBOX_TOKEN?.trim();

  if (token) {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set("access_token", token);
    url.searchParams.set("country", "CA");
    url.searchParams.set("types", "postcode,place");
    url.searchParams.set("limit", "1");

    try {
      const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
      if (res.ok) {
        const data = (await res.json()) as {
          features?: { center?: [number, number] }[];
        };
        const center = data.features?.[0]?.center;
        if (center && center.length === 2) {
          return [roundCoord(center[0]), roundCoord(center[1])];
        }
      }
    } catch {
      /* use fallback */
    }
  }

  const approx = approximateFromPostal(postal);
  return [approx.lon, approx.lat];
}
