import { z } from "zod";

const boolFromString = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") return value;
    if (value === undefined || value === "") return false;
    return value.toLowerCase() === "true" || value === "1";
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  AUTH0_SECRET: z.string().optional(),
  AUTH0_DOMAIN: z.string().optional(),
  AUTH0_CLIENT_ID: z.string().optional(),
  AUTH0_CLIENT_SECRET: z.string().optional(),
  APP_BASE_URL: z.string().optional(),
  ADMIN_AUTH0_SUBS: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional().default("gemini-2.0-flash"),
  AI_ENABLED: boolFromString,
  MAPBOX_TOKEN: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  cached = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH0_SECRET: process.env.AUTH0_SECRET,
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL,
    ADMIN_AUTH0_SUBS: process.env.ADMIN_AUTH0_SUBS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    AI_ENABLED: process.env.AI_ENABLED,
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  });
  return cached;
}

export function requireDatabaseUrl(): string {
  const url = getEnv().DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function isAiEnabled(): boolean {
  return getEnv().AI_ENABLED !== false;
}

export function adminSubs(): string[] {
  return getEnv()
    .ADMIN_AUTH0_SUBS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
