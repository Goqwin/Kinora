/**
 * Retrieval over Supabase `public.resources`: one SQL query filters, then
 * scoreResource() ranks. If fewer than 3 results, relax radius → budget →
 * category (cumulative). Age is never relaxed: we don't show kids' programs
 * outside their ages. Ages are years in UserContext, months in the table.
 * Server-only (imports the DB client).
 */
import { and, eq, getTableColumns, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { resources, type Resource } from "./schema";
import { BUDGET_COST_TYPES, REDUCED_COST_LABEL, type ScheduleTag, type UserContext } from "./types";

export type Relaxation = "radius" | "budget" | "category";
type Row = Omit<Resource, "location" | "searchTsv">;
export type RankedResource = Row & {
  score: number;
  distanceKm: number | null;
  costLabel: string;
  /** From the PostGIS point, for the map. */
  longitude: number;
  latitude: number;
};

export const DEFAULT_RADIUS_KM = 10;
const DISTANCE_SCALE_KM = 20; // distance score reaches 0 at 20 km
const MIN_RESULTS = 3;
const TOP_N = 10;

type Scorable = Pick<Resource, "category" | "costType" | "ageMinMonths" | "ageMaxMonths" | "schedule">;

/** UI wording for cost. Reduced-cost options never claim eligibility. */
export function costLabel(costType: string): string {
  if (costType === "free") return "Free";
  if (costType === "subsidized" || costType === "income_based") return REDUCED_COST_LABEL;
  return "Paid";
}

/** 0–1 (plus up to 0.1 schedule bonus). Weights: category .4, distance .25, cost .2, age .15. */
export function scoreResource(
  r: Scorable,
  distanceKm: number | null,
  ctx: Pick<UserContext, "needs" | "kidsAges" | "budget">,
  scheduleNeeds: ScheduleTag[] = [],
): number {
  const category = ctx.needs.length ? (ctx.needs.some((n) => n === r.category) ? 1 : 0) : 0.5;

  const distance = distanceKm === null ? 0.5 : Math.max(0, 1 - distanceKm / DISTANCE_SCALE_KM);

  const paidAllowed = !ctx.budget || BUDGET_COST_TYPES[ctx.budget].includes("paid");
  const cost =
    r.costType === "free" ? 1
    : r.costType === "subsidized" || r.costType === "income_based" ? 0.7
    : paidAllowed ? 0.3
    : 0;

  const general = r.ageMinMonths === null && r.ageMaxMonths === null;
  // A kid aged `a` years spans months [a*12, a*12+11].
  const fitsKid = ctx.kidsAges.some((a) => (r.ageMinMonths ?? 0) <= a * 12 + 11 && a * 12 <= (r.ageMaxMonths ?? 215));
  const age = !ctx.kidsAges.length || general ? 0.5 : fitsKid ? 1 : 0;

  const bonus = Math.min(0.1, 0.05 * scheduleNeeds.filter((s) => r.schedule.includes(s)).length);

  const total = 0.4 * category + 0.25 * distance + 0.2 * cost + 0.15 * age + bonus;
  return Math.round(total * 1000) / 1000;
}

async function query(ctx: UserContext, radiusKm: number, relaxed: Set<Relaxation>) {
  const loc = ctx.location;
  const point = loc ? sql`ST_SetSRID(ST_MakePoint(${loc.lng}::float8, ${loc.lat}::float8), 4326)::geography` : null;
  const where: (SQL | undefined)[] = [
    eq(resources.isActive, true),
    sql`(${resources.startsAt} IS NULL OR coalesce(${resources.endsAt}, ${resources.startsAt}) >= now())`,
  ];

  if (point && !relaxed.has("radius")) {
    where.push(sql`ST_DWithin(${resources.location}, ${point}, ${radiusKm * 1000})`);
  }
  if (ctx.kidsAges.length) {
    const kids = sql.join(ctx.kidsAges.map((a) => sql`${a * 12}::int`), sql`, `);
    where.push(sql`((${resources.ageMinMonths} IS NULL AND ${resources.ageMaxMonths} IS NULL) OR EXISTS (
      SELECT 1 FROM unnest(ARRAY[${kids}]) m
      WHERE coalesce(${resources.ageMinMonths}, 0) <= m + 11 AND m <= coalesce(${resources.ageMaxMonths}, 215)))`);
  }
  if (ctx.budget && !relaxed.has("budget")) {
    where.push(inArray(resources.costType, BUDGET_COST_TYPES[ctx.budget]));
  }
  if (ctx.needs.length && !relaxed.has("category")) {
    where.push(inArray(resources.category, ctx.needs));
  }

  // Every column except the raw PostGIS point and the search vector (bulky, unused by callers).
  const columns = Object.fromEntries(
    Object.entries(getTableColumns(resources)).filter(([key]) => key !== "location" && key !== "searchTsv"),
  ) as Omit<typeof resources._.columns, "location" | "searchTsv">;
  return db
    .select({
      ...columns,
      longitude: sql<number>`ST_X(${resources.location}::geometry)`,
      latitude: sql<number>`ST_Y(${resources.location}::geometry)`,
      distanceKm: point ? sql<number>`ST_Distance(${resources.location}, ${point}) / 1000` : sql<null>`NULL`,
    })
    .from(resources)
    .where(and(...where))
    .limit(200);
}

export async function retrieveResources(
  ctx: UserContext,
  opts: { scheduleNeeds?: ScheduleTag[]; radiusKm?: number } = {},
): Promise<{ results: RankedResource[]; relaxed: Relaxation[] }> {
  const radiusKm = opts.radiusKm ?? DEFAULT_RADIUS_KM;
  const relaxed = new Set<Relaxation>();
  let rows = await query(ctx, radiusKm, relaxed);
  for (const step of ["radius", "budget", "category"] as const) {
    if (rows.length >= MIN_RESULTS) break;
    relaxed.add(step);
    rows = await query(ctx, radiusKm, relaxed);
  }

  const results = rows
    .map(({ distanceKm, longitude, latitude, ...r }) => {
      const km = distanceKm === null ? null : Math.round(Number(distanceKm) * 10) / 10;
      return { ...r, longitude: Number(longitude), latitude: Number(latitude), distanceKm: km, costLabel: costLabel(r.costType), score: scoreResource(r, km, ctx, opts.scheduleNeeds) };
    })
    // Ties: nearer first, then name, so the order is stable.
    .sort((a, b) => b.score - a.score || (a.distanceKm ?? 99) - (b.distanceKm ?? 99) || a.name.localeCompare(b.name))
    .slice(0, TOP_N);

  return { results, relaxed: [...relaxed] };
}
