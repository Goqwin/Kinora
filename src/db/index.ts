import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/personalization";

// Supabase Postgres (PostGIS enabled). Use the session pooler or direct URL from .env.local.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

export const db = drizzle(pool, { schema });
export type DB = typeof db;
