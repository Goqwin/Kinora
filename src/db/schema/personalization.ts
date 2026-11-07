/**
 * Drizzle schema for the personalization tables (resources catalog,
 * stored contexts, stored intents).
 *
 * PostGIS: `location` is a GENERATED geometry(Point, 4326) column built from
 * lat/lng. Seed scripts and the admin form only write lat/lng. Distance queries
 * cast to geography for metres — `ST_DWithin(location::geography, …)` — which
 * hits the GiST expression index below. (Plain geometry because drizzle-kit
 * mis-quotes a custom geography type in migrations.)
 * The migration must run `CREATE EXTENSION IF NOT EXISTS postgis;` first.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  geometry,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  COST_TYPES,
  LANGUAGES,
  NEED_CATEGORIES,
  RESOURCE_KINDS,
  URGENCY_LEVELS,
  type StructuredIntent,
  type UserContext,
} from "../../lib/personalization/types";

/* Enums mirror the TS vocabularies so DB and app can't disagree. */
export const needCategoryEnum = pgEnum("need_category", NEED_CATEGORIES);
export const costTypeEnum = pgEnum("cost_type", COST_TYPES);
export const resourceKindEnum = pgEnum("resource_kind", RESOURCE_KINDS);
export const languageEnum = pgEnum("language_code", LANGUAGES);
export const urgencyEnum = pgEnum("urgency_level", URGENCY_LEVELS);

/* ------------------------------------------------------------------ */
/* resources — the verified catalog (events are resources with dates)  */
/* ------------------------------------------------------------------ */

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stable human-readable key for seeds/tests: "ywca-childcare-downtown". */
    slug: text("slug").notNull().unique(),
    kind: resourceKindEnum("kind").notNull().default("service"),
    name: text("name").notNull(),
    description: text("description").notNull(),
    categories: needCategoryEnum("categories").array().notNull(),

    // Location
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 })
      .notNull()
      .generatedAlwaysAs(sql`ST_SetSRID(ST_MakePoint(lng, lat), 4326)`),
    /** Public street address of the organisation (fine to show; it's theirs). */
    address: text("address"),
    /** Province-wide / phone / online services: skip distance filtering. */
    servesAllCalgary: boolean("serves_all_calgary").notNull().default(false),

    // Cost
    costType: costTypeEnum("cost_type").notNull(),
    /** Typical monthly cost to the parent in CAD after any built-in subsidy. 0 = free. */
    costMonthlyCad: integer("cost_monthly_cad"),
    costNotes: text("cost_notes"),

    // Eligibility — copied from the source, never generated
    ageMinYears: integer("age_min_years"),
    ageMaxYears: integer("age_max_years"),
    incomeTested: boolean("income_tested").notNull().default(false),
    eligibilityNotes: text("eligibility_notes"),
    languages: languageEnum("languages").array().notNull().default(sql`ARRAY['en']::language_code[]`),

    // Schedule hints used to match "works nights" etc.
    offersEvenings: boolean("offers_evenings").notNull().default(false),
    offersOvernight: boolean("offers_overnight").notNull().default(false),
    offersWeekends: boolean("offers_weekends").notNull().default(false),
    dropIn: boolean("drop_in").notNull().default(false),

    // Events
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),

    // Contact + provenance — shown verbatim, never produced by Gemini
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    source: text("source").notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull(),

    isCrisisResource: boolean("is_crisis_resource").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Expression index so `location::geography` distance queries (metres) use it.
    index("resources_location_geog_gix").using("gist", sql`(${t.location}::geography)`),
    index("resources_categories_gin").using("gin", t.categories),
    index("resources_starts_at_idx").on(t.startsAt),
    check("resources_lat_range", sql`${t.lat} BETWEEN 50.5 AND 51.6`),
    check("resources_lng_range", sql`${t.lng} BETWEEN -114.8 AND -113.5`),
    check(
      "resources_age_range",
      sql`${t.ageMinYears} IS NULL OR ${t.ageMaxYears} IS NULL OR ${t.ageMinYears} <= ${t.ageMaxYears}`,
    ),
    check(
      "resources_event_has_date",
      sql`${t.kind} <> 'event' OR ${t.startsAt} IS NOT NULL`,
    ),
  ],
);
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

/* ------------------------------------------------------------------ */
/* user_contexts — saved onboarding for LOGGED-IN users only.          */
/* Anonymous users' context lives in the browser session, never here.  */
/* ------------------------------------------------------------------ */

export const userContexts = pgTable("user_contexts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Auth0 `sub`. Server-side only — never sent to Gemini or the client. */
  auth0Sub: text("auth0_sub").notNull().unique(),
  /** Normalized UserContext (coarsened location, ages, needs…), not raw form input. */
  context: jsonb("context").$type<UserContext>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* intake_intents — structured intent per intake. NO raw free text.    */
/* ------------------------------------------------------------------ */

export const intakeIntents = pgTable(
  "intake_intents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null for anonymous intakes (kept only for aggregate demo stats, or skip inserting). */
    userContextId: uuid("user_context_id").references(() => userContexts.id, {
      onDelete: "cascade",
    }),
    intent: jsonb("intent").$type<StructuredIntent>().notNull(),
    urgency: urgencyEnum("urgency").notNull(),
    crisisFlagged: boolean("crisis_flagged").notNull().default(false),
    /** "gemini" | "fallback" — useful to show the no-AI path works in the demo. */
    intentSource: text("intent_source").notNull(),
    /** Resource IDs the plan referenced, after validation. */
    planResourceIds: uuid("plan_resource_ids").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("intake_intents_user_idx").on(t.userContextId, t.createdAt)],
);
export type IntakeIntentRow = typeof intakeIntents.$inferSelect;
