import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { z } from "zod";

import type { CatalogResource } from "./types";

const resourceRowSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string(),
  address_line: z.string(),
  city: z.string(),
  postal_code: z.string(),
  longitude: z.coerce.number(),
  latitude: z.coerce.number(),
  cost_type: z.string(),
  cost_notes: z.string(),
  age_min_months: z.coerce.number().optional(),
  age_max_months: z.coerce.number().optional(),
  eligibility_summary: z.string(),
  eligibility_requirements: z.string(),
  languages: z.string(),
  phone: z.string(),
  email: z.string().optional().default(""),
  website: z.string(),
  source_url: z.string(),
  last_verified_at: z.string(),
  verified_by: z.string().optional().default(""),
  is_active: z.string(),
});

function splitList(value: string): string[] {
  return value.split(/[|;]/).map((part) => part.trim()).filter(Boolean);
}

function mapRow(row: z.infer<typeof resourceRowSchema>): CatalogResource {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    addressLine: row.address_line,
    city: row.city,
    postalCode: row.postal_code,
    longitude: row.longitude,
    latitude: row.latitude,
    costType: row.cost_type,
    costNotes: row.cost_notes,
    ageMinMonths: row.age_min_months ?? null,
    ageMaxMonths: row.age_max_months ?? null,
    eligibilitySummary: row.eligibility_summary,
    eligibilityRequirements: splitList(row.eligibility_requirements),
    languages: splitList(row.languages),
    phone: row.phone,
    email: row.email ?? "",
    website: row.website,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
    verifiedBy: row.verified_by ?? "",
    isActive: row.is_active.toLowerCase() === "true",
  };
}

let cached: CatalogResource[] | null = null;

export function getCsvCatalogResources(): CatalogResource[] {
  if (cached) return cached;
  const csvPath = join(process.cwd(), "data", "resources.csv");
  const raw = readFileSync(csvPath, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
  cached = rows
    .map((row) => resourceRowSchema.parse(row))
    .filter((row) => row.is_active.toLowerCase() === "true")
    .map(mapRow);
  return cached;
}

export function getCsvResourceBySlug(slug: string): CatalogResource | undefined {
  return getCsvCatalogResources().find((r) => r.slug === slug);
}
