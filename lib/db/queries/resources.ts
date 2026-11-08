import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import type { CatalogResource } from "@/lib/resources/types";

type ResourceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  subcategory: string | null;
  address_line: string | null;
  city: string | null;
  postal_code: string | null;
  longitude: number;
  latitude: number;
  cost_type: string;
  cost_notes: string | null;
  age_min_months: number | null;
  age_max_months: number | null;
  eligibility_summary: string | null;
  eligibility_requirements: string[] | null;
  languages: string[] | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  source_url: string;
  last_verified_at: Date;
  verified_by: string | null;
  is_active: boolean;
  distance_km: number | null;
};

function mapRow(row: ResourceRow): CatalogResource {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory ?? "",
    addressLine: row.address_line ?? "",
    city: row.city ?? "Calgary",
    postalCode: row.postal_code ?? "",
    longitude: row.longitude,
    latitude: row.latitude,
    costType: row.cost_type,
    costNotes: row.cost_notes ?? "",
    ageMinMonths: row.age_min_months,
    ageMaxMonths: row.age_max_months,
    eligibilitySummary: row.eligibility_summary ?? "",
    eligibilityRequirements: row.eligibility_requirements ?? [],
    languages: row.languages ?? ["en"],
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    sourceUrl: row.source_url,
    lastVerifiedAt:
      row.last_verified_at instanceof Date
        ? row.last_verified_at.toISOString().slice(0, 10)
        : String(row.last_verified_at),
    verifiedBy: row.verified_by ?? "",
    isActive: row.is_active,
    distanceKm: row.distance_km ?? undefined,
  };
}

export async function listActiveResources(options?: {
  userLon?: number;
  userLat?: number;
  radiusKm?: number;
  categories?: string[];
}): Promise<CatalogResource[]> {
  const db = getDb();
  const radiusM = (options?.radiusKm ?? 25) * 1000;
  const hasPoint =
    options?.userLon !== undefined && options?.userLat !== undefined;

  const categoryFilter =
    options?.categories && options.categories.length > 0
      ? sql`AND category IN (${sql.join(
          options.categories.map((category) => sql`${category}`),
          sql`, `,
        )})`
      : sql``;

  const result = await db.execute(sql`
    SELECT
      id,
      slug,
      name,
      description,
      category,
      subcategory,
      address_line,
      city,
      postal_code,
      ST_X(location::geometry) AS longitude,
      ST_Y(location::geometry) AS latitude,
      cost_type,
      cost_notes,
      age_min_months,
      age_max_months,
      eligibility_summary,
      eligibility_requirements,
      languages,
      phone,
      email,
      website,
      source_url,
      last_verified_at,
      verified_by,
      is_active,
      ${
        hasPoint
          ? sql`ST_Distance(
              location,
              ST_SetSRID(ST_MakePoint(${options!.userLon!}, ${options!.userLat!}), 4326)::geography
            ) / 1000.0 AS distance_km`
          : sql`NULL::float8 AS distance_km`
      }
    FROM resources
    WHERE is_active = true
    ${categoryFilter}
    ${
      hasPoint
        ? sql`AND ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(${options!.userLon!}, ${options!.userLat!}), 4326)::geography,
            ${radiusM}
          )`
        : sql``
    }
    ORDER BY ${hasPoint ? sql`distance_km ASC` : sql`name ASC`}
    LIMIT 50
  `);

  return (result as unknown as ResourceRow[]).map(mapRow);
}

export async function getResourceBySlugFromDb(
  slug: string,
): Promise<CatalogResource | undefined> {
  const db = getDb();
  const result = await db.execute(sql`
    SELECT
      id,
      slug,
      name,
      description,
      category,
      subcategory,
      address_line,
      city,
      postal_code,
      ST_X(location::geometry) AS longitude,
      ST_Y(location::geometry) AS latitude,
      cost_type,
      cost_notes,
      age_min_months,
      age_max_months,
      eligibility_summary,
      eligibility_requirements,
      languages,
      phone,
      email,
      website,
      source_url,
      last_verified_at,
      verified_by,
      is_active,
      NULL::float8 AS distance_km
    FROM resources
    WHERE slug = ${slug} AND is_active = true
    LIMIT 1
  `);

  const row = (result as unknown as ResourceRow[])[0];
  return row ? mapRow(row) : undefined;
}

export async function getResourceIdBySlug(
  slug: string,
): Promise<string | null> {
  const row = await getResourceBySlugFromDb(slug);
  return row?.id ?? null;
}
