import { loadEnvLocal } from "@/lib/load-env-local";

loadEnvLocal();
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { closeDb, getDb } from "@/lib/db";

const seedRowSchema = z.object({
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
  if (!value) return [];
  return value.split(/[|;]/).map((part) => part.trim()).filter(Boolean);
}

/** Bind CSV list columns as a single Postgres text[] parameter. */
function pgTextArray(values: string[]) {
  if (values.length === 0) {
    return sql`ARRAY[]::text[]`;
  }
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

async function main() {
  const db = getDb();
  const csvPath = join(process.cwd(), "data", "resources.csv");
  const raw = readFileSync(csvPath, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  for (const row of rows) {
    const data = seedRowSchema.parse(row);
    if (data.is_active.toLowerCase() !== "true") continue;

    await db.execute(sql`
      INSERT INTO resources (
        slug, name, description, category, subcategory,
        address_line, city, postal_code, location,
        cost_type, cost_notes, age_min_months, age_max_months,
        eligibility_summary, eligibility_requirements, languages,
        phone, email, website, source_url, last_verified_at, verified_by, is_active
      ) VALUES (
        ${data.slug},
        ${data.name},
        ${data.description},
        ${data.category},
        ${data.subcategory},
        ${data.address_line},
        ${data.city},
        ${data.postal_code},
        ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)::geography,
        ${data.cost_type},
        ${data.cost_notes},
        ${data.age_min_months ?? null},
        ${data.age_max_months ?? null},
        ${data.eligibility_summary},
        ${pgTextArray(splitList(data.eligibility_requirements))},
        ${pgTextArray(splitList(data.languages))},
        ${data.phone},
        ${data.email || null},
        ${data.website || null},
        ${data.source_url},
        ${data.last_verified_at}::timestamptz,
        ${data.verified_by || null},
        true
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        subcategory = EXCLUDED.subcategory,
        address_line = EXCLUDED.address_line,
        city = EXCLUDED.city,
        postal_code = EXCLUDED.postal_code,
        location = EXCLUDED.location,
        cost_type = EXCLUDED.cost_type,
        cost_notes = EXCLUDED.cost_notes,
        age_min_months = EXCLUDED.age_min_months,
        age_max_months = EXCLUDED.age_max_months,
        eligibility_summary = EXCLUDED.eligibility_summary,
        eligibility_requirements = EXCLUDED.eligibility_requirements,
        languages = EXCLUDED.languages,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        website = EXCLUDED.website,
        source_url = EXCLUDED.source_url,
        last_verified_at = EXCLUDED.last_verified_at,
        verified_by = EXCLUDED.verified_by,
        is_active = EXCLUDED.is_active,
        updated_at = now()
    `);
  }

  console.log(`Seeded ${rows.length} resource row(s) from data/resources.csv`);
  await closeDb();
}

main().catch((error: unknown) => {
  if (error instanceof Error && error.message.includes("DATABASE_URL")) {
    console.error(
      "DATABASE_URL is not set. Add the Supabase pooler URI to .env.local before seeding.",
    );
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Seed failed.");
  }
  void closeDb().finally(() => process.exit(1));
});
