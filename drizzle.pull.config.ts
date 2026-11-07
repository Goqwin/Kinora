import { defineConfig } from "drizzle-kit";

// Optional: pull schema introspection from Supabase (team-managed tables).
// Never generate/migrate/push against production with this config.
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/db/schema/supabase.ts",
  out: "./drizzle-pull",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  schemaFilter: ["public"],
  tablesFilter: [
    "resources",
    "users",
    "user_preferences",
    "support_plans",
    "plan_actions",
  ],
  extensionsFilters: ["postgis"],
});
