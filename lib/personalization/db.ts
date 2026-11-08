/**
 * Server-only DB client. Our connection bypasses Supabase RLS, so this module
 * must never be imported from client components (only from route handlers,
 * server code and scripts). No `server-only` import here because the seed
 * script and tests run outside Next.js.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Supabase Postgres (PostGIS enabled). Use the session pooler or direct URL from .env.local.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

export const db = drizzle(pool, { schema });
export type DB = typeof db;
