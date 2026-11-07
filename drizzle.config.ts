import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next.js env files; load the Supabase URL ourselves.
process.loadEnvFile(".env.local");

// Supabase (public schema) is the source of truth and is managed by the team.
// Only use `drizzle-kit pull` here — never generate/migrate/push against it.
export default defineConfig({
  schema: "./src/db/schema/supabase.ts",
  out: "./drizzle-pull",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  schemaFilter: ["public"],
  tablesFilter: ["resources", "users", "user_preferences", "support_plans", "plan_actions"],
  extensionsFilters: ["postgis"],
});
