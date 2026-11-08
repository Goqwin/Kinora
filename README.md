# Personalized Support Navigator (Kinora)

Calgary-focused Next.js app that helps single parents find verified childcare, financial aid, and community supports.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm db:migrate` | Apply `drizzle/0000_init.sql` |
| `pnpm db:seed` | Upsert `data/resources.csv` |
| `pnpm db:seed:personalization` | Upsert the fake `data/organizations.json` |
| `pnpm db:verify` | Check PostGIS, RLS, resource count |
| `pnpm db:pull` | Introspect the team Supabase schema (read-only) |

See `.env.example` for `DATABASE_URL`, Auth0, Mapbox, and Gemini flags.

Do not run `drizzle-kit push` against production Supabase. App migrations use `pnpm db:migrate` / SQL editor scripts under `drizzle/`.

## Project layout

| Folder | Contents |
|--------|----------|
| `app/` | Routes: `(marketing)` landing, `(main)` app pages, `api/`, server `actions/` |
| `components/` | UI by feature: `account`, `community`, `home`, `layout`, `map`, `plan`, `resources`, `safety`, `theme`, plus shadcn `ui/` |
| `lib/` | Logic by domain: `ai`, `auth`, `db`, `env`, `mapbox`, `matching`, `moderation`, `personalization`, `resources`, `safety`, `search` |
| `scripts/` | Database and seed-data scripts (TypeScript and Python) |
| `data/` | Seed data: `resources.csv`, fake `organizations.*` and `families.*` |
| `drizzle/` | SQL migrations and the read-only `pull.config.ts` |
| `docs/` | `PRD.md`, `DECISIONS.md`, `SCHEMA.md` |
| `tests/` | Vitest suites |

`lib/personalization/` is the Gemini intent → retrieval → support-plan pipeline. It has its own database client (`db.ts`) and the Supabase-pulled schema (`schema.ts`), and is covered by the tests in `tests/`.

Agent rules: `AGENTS.md`.
