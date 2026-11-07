# Hackathon-SingleParent-2026

Personalization layer for matching Calgary single parents with verified resources.

- `src/lib/personalization/` — onboarding answers → normalized `UserContext` (coarsened to postal FSA, never a full address), merge with Gemini's structured intent, and the LLM-safe projection.
- `src/db/schema/personalization.ts` — Drizzle schema: `resources` (PostGIS point, generated from lat/lng), `user_contexts` (logged-in users only), `intake_intents` (structured intent, no raw free text).

## Setup

```bash
npm install
cp .env.example .env.local   # Supabase DATABASE_URL (PostGIS enabled)
```

| Script | What it does |
| --- | --- |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate a migration from the schema, then patch in PostGIS SRID + extension |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:check` | Run migrations against in-memory Postgres + PostGIS and smoke-test a radius query |
