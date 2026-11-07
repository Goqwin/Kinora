# Personalized Support Navigator (Kinora)

Calgary-focused Next.js app that helps single parents find verified childcare, financial aid, and community supports.

## App (repo root)

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
| `pnpm db:verify` | Check PostGIS, RLS, resource count |

See `.env.example` for `DATABASE_URL`, Auth0, Mapbox, and Gemini flags.

## Personalization layer (`src/`)

Also on `main`: a personalization / retrieval package under `src/lib/personalization/` and `src/db/`, plus its own tests. That code talks to the shared Supabase schema. Prefer `pnpm test` from the root app config; both test trees live under `tests/`.

Do not run `drizzle-kit push` against production Supabase. App migrations use `pnpm db:migrate` / SQL editor scripts under `drizzle/`.

## Notes

- Catalog seed data: `data/resources.csv`
- Early Mapbox experiment: `web/` (reference only)
- Agent rules: `AGENTS.md`
