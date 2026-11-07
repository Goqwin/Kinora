# Decisions

## 2026-11-07 — Database host

Supabase Postgres + PostGIS, matching `prd.md` and `AGENTS.md` (not TigerData).

## 2026-11-07 — Auth0 route paths

Installed `@auth0/nextjs-auth0` v4 uses `/auth/login`, `/auth/logout`, `/auth/callback` via `Auth0Client` middleware (`proxy.ts` on Next.js 16). We follow the SDK instead of `/api/auth/[auth0]`.

## 2026-11-07 — Env validation at build time

`lib/env.ts` uses lazy parsing with build-safe defaults so `next build` works without secrets. Runtime DB/AI/auth calls fail clearly when required vars are missing.

## 2026-11-07 — PRD filename casing

Repo keeps both `PRD.md` and `prd.md` (identical) so Linux tooling that expects lowercase resolves.

## 2026-11-07 — Seed placeholders

Five CSV rows are clearly marked `PLACEHOLDER` with mock Calgary coordinates until real verified records are supplied.

## 2026-11-07 — organizations.json / families.json

Root-level org and family JSON/CSV files are synthetic hackathon personas (fictional names and neighbourhoods). They lack authoritative `source_url` and must not be upserted into `resources` as verified data until each row is source-checked and geocoded per `prd.md` §13.

## 2026-11-07 — Schema enums as text + CHECK

Postgres enums are not used. Status and category values use `text` with `CHECK` constraints in `drizzle/0000_init.sql` and Drizzle `check()` builders so seed data and Drizzle Kit stay aligned without enum migration churn.

## 2026-11-07 — Generated tsvector columns

`resources.search_tsv` and `community_posts.search_tsv` are `GENERATED ALWAYS AS ... STORED` in SQL only. Drizzle maps them via `lib/db/tsvector-type.ts` for reads and GIN indexes; inserts (including seed) omit these columns.

## 2026-11-07 — community_reports.resolved_at

PRD §11.3 requires admin actions to record resolver and time. `resolved_at` was added alongside existing `resolved_by` (not named explicitly in §8.1 table list but implied by admin logging).

## 2026-11-07 — support_plans.user_id NOT NULL

Saved plans require a logged-in user (FR-02). Nullable `user_id` was tightened to NOT NULL with CASCADE delete.

## 2026-11-07 — Rate-limit helper indexes

Btree indexes on `(author_id, created_at)` for posts and replies and `(reporter_id, created_at)` for reports support DB-count rate limits (5/20/10 per day) without Redis.

## 2026-11-07 — Frontend design system (slice 1)

Warm public-service UI: canvas `#f7f4ef`, ink `#1f2a23`, accent coral `#c45f43`, trust green `#3d6b52`. Display type is Fraunces; UI type is Figtree (not Inter/system). Resource “May be outdated” uses a fixed reference date for static prerender compatibility with `cacheComponents` enabled.

## 2026-11-07 — Child age bands (Kinora)

Product age bands are `ages_0_3`, `ages_3_8`, `ages_8_12`, `ages_12_17`, `ages_18_plus` (labels 0–3, 3–8, 8–12, 12–17, 18+). These replace PRD `infant` / `toddler` / `preschool` / `school_age` for preferences, AI criteria, and matching month maps.
