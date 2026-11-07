import { loadEnvLocal } from "@/lib/load-env-local";

loadEnvLocal();

import postgres from "postgres";

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) return databaseUrl;

  const directUrl = process.env.DIRECT_URL?.trim();
  if (directUrl) return directUrl;

  console.error(
    "DATABASE_URL is not set. Add the Supabase pooler URI to .env.local before running verify-db.",
  );
  process.exit(1);
}

async function main() {
  const client = postgres(resolveDatabaseUrl(), { prepare: false, max: 1 });
  try {
    const postgis = await client<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'postgis'
    `;
    console.log(
      postgis.length ? "OK postgis extension installed" : "MISSING postgis",
    );

    const rls = await client<{ relname: string; rls: boolean }[]>`
      SELECT relname, relrowsecurity AS rls
      FROM pg_class
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE nspname = 'public'
        AND relkind = 'r'
        AND relname IN (
          'users', 'resources', 'community_posts', 'saved_resources'
        )
      ORDER BY relname
    `;
    for (const row of rls) {
      console.log(
        row.rls ? `OK RLS enabled on ${row.relname}` : `MISSING RLS on ${row.relname}`,
      );
    }

    const count = await client<{ count: string }[]>`
      SELECT count(*)::text AS count FROM resources WHERE is_active = true
    `;
    console.log(`Active resources in DB: ${count[0]?.count ?? "0"}`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) console.error(error.message);
  else console.error("verify-db failed");
  process.exit(1);
});
