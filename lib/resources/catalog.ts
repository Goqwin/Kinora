import { isDatabaseConfigured } from "@/lib/db";
import {
  getResourceBySlugFromDb,
  listActiveResources,
} from "@/lib/db/queries/resources";

import {
  getCsvCatalogResources,
  getCsvResourceBySlug,
} from "./csv-catalog";
import type { CatalogResource } from "./types";

export { CATEGORY_LABELS, categoryLabel } from "./category-labels";

export async function getCatalogResources(options?: {
  userLon?: number;
  userLat?: number;
  radiusKm?: number;
  categories?: string[];
}): Promise<CatalogResource[]> {
  if (isDatabaseConfigured()) {
    try {
      return await listActiveResources(options);
    } catch {
      /* fall back to CSV */
    }
  }
  return filterCsvCatalog(options);
}

export async function getCatalogResourceBySlug(
  slug: string,
): Promise<CatalogResource | undefined> {
  if (isDatabaseConfigured()) {
    try {
      const row = await getResourceBySlugFromDb(slug);
      if (row) return row;
    } catch {
      /* fall back */
    }
  }
  return getCsvResourceBySlug(slug);
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function filterCsvCatalog(options?: {
  userLon?: number;
  userLat?: number;
  radiusKm?: number;
  categories?: string[];
}): CatalogResource[] {
  let rows = getCsvCatalogResources();
  if (options?.categories?.length) {
    rows = rows.filter((r) => options.categories!.includes(r.category));
  }
  if (options?.userLon !== undefined && options?.userLat !== undefined) {
    const radius = options.radiusKm ?? 25;
    rows = rows
      .map((r) => ({
        ...r,
        distanceKm: haversineKm(
          options.userLat!,
          options.userLon!,
          r.latitude,
          r.longitude,
        ),
      }))
      .filter((r) => (r.distanceKm ?? 0) <= radius)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }
  return rows;
}

/** Sync catalog for tests and static fallbacks */
export function getCatalogResourcesSync(): CatalogResource[] {
  return getCsvCatalogResources();
}
