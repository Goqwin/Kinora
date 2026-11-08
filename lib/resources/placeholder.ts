import {
  categoryLabel,
  getCatalogResourcesSync,
} from "@/lib/resources/catalog";
import { getCsvResourceBySlug } from "@/lib/resources/csv-catalog";
import type { CatalogResource } from "@/lib/resources/types";

export type PlaceholderResource = Omit<
  CatalogResource,
  "longitude" | "latitude" | "ageMinMonths" | "ageMaxMonths" | "verifiedBy"
> & {
  longitude?: number;
  latitude?: number;
};

export { categoryLabel };

function toPlaceholder(resource: CatalogResource): PlaceholderResource {
  // Omit geo/age fields from the legacy placeholder shape used by older UI bits.
  const {
    longitude: _lon,
    latitude: _lat,
    ageMinMonths: _min,
    ageMaxMonths: _max,
    verifiedBy: _verified,
    ...rest
  } = resource;
  void _lon;
  void _lat;
  void _min;
  void _max;
  void _verified;
  return rest;
}

export function getPlaceholderResources(): PlaceholderResource[] {
  return getCatalogResourcesSync().map(toPlaceholder);
}

export function getPlaceholderResourceBySlug(
  slug: string,
): PlaceholderResource | undefined {
  const row = getCsvResourceBySlug(slug);
  return row ? toPlaceholder(row) : undefined;
}
