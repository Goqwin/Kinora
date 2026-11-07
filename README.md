# Hackathon-SingleParent-2026

Personalization layer for matching Calgary single parents with verified resources.

- `src/lib/personalization/` — onboarding answers → normalized `UserContext` (coarsened to postal FSA, never a full address), merge with Gemini's structured intent, the LLM-safe projection, and resource retrieval/ranking.
- `src/db/schema/supabase.ts` — Drizzle schema pulled from the team's Supabase database (`resources`, `users`, `user_preferences`, `support_plans`, `plan_actions`). Supabase is the source of truth and is managed by the team: never run `drizzle-kit generate`/`migrate`/`push` against it. Refresh with `npx drizzle-kit pull`.
- `src/db/` is server-only: our connection bypasses RLS, so never import it from client components.

## Setup

```bash
npm install
cp .env.example .env.local   # Supabase DATABASE_URL (PostGIS enabled)
```

| Script | What it does |
| --- | --- |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:seed` | Upsert the fake organizations.json (+ one fake event) into `resources` |
