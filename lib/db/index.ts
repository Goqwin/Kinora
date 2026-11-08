import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

let queryClient: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(getEnv().DATABASE_URL);
}

export function getDb() {
  const url = getEnv().DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!queryClient) {
    queryClient = postgres(url, { prepare: false, max: 5 });
    db = drizzle(queryClient, { schema });
  }
  return db!;
}

/** Release the pooled client (CLI scripts should call after work finishes). */
export async function closeDb(): Promise<void> {
  if (queryClient) {
    await queryClient.end({ timeout: 5 });
    queryClient = null;
    db = null;
  }
}

export type Database = ReturnType<typeof getDb>;
