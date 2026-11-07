import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next.js env files; load the Supabase URL ourselves.
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // PostGIS creates its own tables/views; keep drizzle-kit from trying to drop them.
  extensionsFilters: ["postgis"],
});
