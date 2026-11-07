import { loadEnvLocal } from "@/lib/load-env-local";

loadEnvLocal();
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error(
    "DIRECT_URL is not set. Add the Supabase direct connection string to .env.local (Settings → Database).",
  );
  process.exit(1);
}

const sqlFile = join(process.cwd(), "drizzle", "0000_init.sql");
const statements = readFileSync(sqlFile, "utf-8");

async function main() {
  const url = directUrl as string;
  const client = postgres(url, { prepare: false, max: 1 });
  try {
    await client.unsafe(statements);
    console.log("Migration applied: drizzle/0000_init.sql");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error("Migration failed.");
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
});
