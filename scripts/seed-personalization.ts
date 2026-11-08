/**
 * Seed Supabase `public.resources` from the team's fake organizations.json
 * (+ one fake future event). Re-runnable: upserts on slug and never touches
 * other rows (e.g. the PLACEHOLDER ones). Run with `npm run db:seed`.
 *
 * organizations.json has no coordinates, cost, category or schedule, so they
 * are derived here. Costs not stated in the description are marked
 * "sample value" in cost_notes. Everything is fake demo data.
 */
process.loadEnvFile(".env.local");

import { readFileSync } from "node:fs";
import { sql, type SQL } from "drizzle-orm";
import { CALGARY_FSA_CENTROIDS } from "../lib/personalization/calgary-areas";
import type { CostType, NeedCategory, ScheduleTag } from "../lib/personalization/types";
import type { NewResource } from "../lib/personalization/schema";

/** location is written as a PostGIS expression, not a value. */
type SeedRow = Omit<NewResource, "location"> & { location: SQL };

type Org = {
  id: string;
  name: string;
  type: string;
  neighbourhood: string;
  address: string;
  postal_code: string;
  suitable_ages: string[];
  description: string;
};

const VERIFIED_BY = "team sample data (fake)";

/** First matching keyword wins; otherwise the org type decides. */
const KEYWORD_CATEGORY: [RegExp, NeedCategory][] = [
  [/legal/, "legal_info"],
  [/housing|rental/, "housing"],
  [/food|grocer/, "food"],
  [/subsid|benefit|income support/, "financial"],
];
const TYPE_CATEGORY: Record<string, NeedCategory> = {
  Daycare: "childcare",
  "Support program": "community",
  "Child services": "health_family",
  "Government assistance": "financial",
  Outreach: "community",
  "Youth program": "activities",
};
/** Cost when the description doesn't say. Marked "sample value". */
const TYPE_DEFAULT_COST: Record<string, CostType> = {
  Daycare: "paid",
  "Support program": "free",
  "Child services": "income_based",
  "Government assistance": "free",
  Outreach: "free",
  "Youth program": "paid",
};
const SCHEDULE_KEYWORDS: [RegExp, ScheduleTag][] = [
  [/evening|night|shift/, "evenings"],
  [/overnight/, "overnight"],
  [/weekend|saturday|holiday/, "weekends"],
  [/drop-in|walk-in/, "drop_in"],
];

const point = (lat: number, lng: number) => sql`ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography`;

/** "3-5" years → [36, 71] months. "Adults" is not a child band, so it adds no limit. */
function ageRangeMonths(bands: string[]): [number | null, number | null] {
  const nums = bands.filter((b) => /^\d+-\d+$/.test(b)).flatMap((b) => b.split("-").map(Number));
  return nums.length ? [Math.min(...nums) * 12, Math.max(...nums) * 12 + 11] : [null, null];
}

function cost(type: string, d: string): { costType: CostType; costNotes: string } {
  if (/\bfree\b|no questions asked/.test(d)) return { costType: "free", costNotes: "Free (from description)" };
  if (/sliding-scale/.test(d)) return { costType: "income_based", costNotes: "Sliding-scale fee (from description)" };
  return { costType: TYPE_DEFAULT_COST[type] ?? "paid", costNotes: "sample value" };
}

function mapOrg(org: Org, i: number, now: string): SeedRow {
  const d = org.description.toLowerCase();
  const fsa = org.postal_code.slice(0, 3).toUpperCase();
  const centre = CALGARY_FSA_CENTROIDS[fsa];
  if (!centre) throw new Error(`${org.id}: no centroid for FSA ${fsa}`);
  // Small deterministic offset (≤ ~0.5 km) so orgs in one FSA don't overlap on the map.
  const jitter = (n: number) => (((i * n) % 9) - 4) * 0.0012;
  const [ageMinMonths, ageMaxMonths] = ageRangeMonths(org.suitable_ages);

  return {
    slug: `team-${org.id.replace(/_/g, "-")}`,
    name: org.name,
    description: org.description,
    category: KEYWORD_CATEGORY.find(([re]) => re.test(d))?.[1] ?? TYPE_CATEGORY[org.type] ?? "community",
    subcategory: org.type,
    addressLine: `${org.address}, ${org.neighbourhood} (fake address)`,
    postalCode: org.postal_code,
    location: point(centre.lat + jitter(7), centre.lng + jitter(5)),
    ...cost(org.type, d),
    ageMinMonths,
    ageMaxMonths,
    schedule: SCHEDULE_KEYWORDS.filter(([re]) => re.test(d)).map(([, tag]) => tag),
    sourceUrl: "sample://organizations.json",
    verifiedBy: VERIFIED_BY,
    lastVerifiedAt: now,
  };
}

function fakeEvent(now: string): SeedRow {
  const startsAt = new Date(Date.parse(now) + 14 * 24 * 3600 * 1000);
  startsAt.setUTCHours(17, 0, 0, 0); // 10:00 Calgary time
  const centre = CALGARY_FSA_CENTROIDS.T2E!;
  return {
    slug: "sample-event-family-fun-day",
    name: "Family Fun Day (sample event)",
    description: "Fake demo event: free outdoor games, crafts and a snack table for families with kids of all ages.",
    category: "activities",
    subcategory: "Event",
    location: point(centre.lat, centre.lng),
    costType: "free",
    costNotes: "Free (sample value)",
    schedule: ["weekends", "drop_in"],
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + 4 * 3600 * 1000).toISOString(),
    sourceUrl: "sample://seed-event",
    verifiedBy: VERIFIED_BY,
    lastVerifiedAt: now,
  };
}

async function main() {
  // Dynamic import: static imports are hoisted above loadEnvFile, and the pool reads DATABASE_URL.
  const { db } = await import("../lib/personalization/db");
  const { resources } = await import("../lib/personalization/schema");
  const now = new Date().toISOString();
  const orgs: Org[] = JSON.parse(readFileSync("data/organizations.json", "utf8"));
  const rows = [...orgs.map((o, i) => mapOrg(o, i, now)), fakeEvent(now)];

  for (const row of rows) {
    await db
      .insert(resources)
      .values(row)
      .onConflictDoUpdate({ target: resources.slug, set: { ...row, updatedAt: now } });
  }
  console.log(`Upserted ${rows.length} resources (${orgs.length} orgs + 1 sample event).`);
  await db.$client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
