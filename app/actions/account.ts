"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOptionalUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  BUDGET_BANDS,
  CHILD_AGE_BANDS,
  INTEREST_TAGS,
} from "@/lib/db/schema-constants";
import { upsertPreferences } from "@/lib/db/queries/preferences";

const childFirstNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Use letters only for first names");

const preferencesSchema = z.object({
  postalFsa: z.string().trim().max(7).optional(),
  childAgeBands: z.array(z.enum(CHILD_AGE_BANDS)).max(5),
  interestTags: z.array(z.enum(INTEREST_TAGS)).max(8),
  childFirstNames: z.array(childFirstNameSchema).max(6),
  openToMeetParents: z.boolean(),
  budgetBand: z.enum(BUDGET_BANDS).nullable(),
  language: z.string().trim().min(2).max(10).default("en"),
});

export type SavePreferencesResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizePostalFsa(raw: string | undefined): string | null {
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (!compact) return null;
  const fsa = compact.slice(0, 3);
  if (!/^[A-Z]\d[A-Z]$/.test(fsa)) return null;
  return fsa;
}

export async function savePreferencesAction(
  input: unknown,
): Promise<SavePreferencesResult> {
  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in to save your preferences." };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not configured yet." };
  }

  // Session-only fallback users (Auth0 sub as id) cannot write prefs.
  if (!/^[0-9a-f-]{36}$/i.test(user.id)) {
    return {
      ok: false,
      error:
        "Account sync is not ready. Try again after the database is connected.",
    };
  }

  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Check your preferences and try again.",
    };
  }

  const rawPostal = parsed.data.postalFsa?.trim();
  let postalFsa: string | null = null;
  if (rawPostal) {
    postalFsa = normalizePostalFsa(rawPostal);
    if (!postalFsa) {
      return { ok: false, error: "Use a 3-character Calgary FSA like T2Y." };
    }
  }

  const catalogCategories = parsed.data.interestTags.filter(
    (tag) =>
      tag === "childcare" ||
      tag === "financial" ||
      tag === "housing" ||
      tag === "food" ||
      tag === "health_family" ||
      tag === "activities",
  );

  try {
    await upsertPreferences({
      userId: user.id,
      postalFsa,
      childAgeBands: parsed.data.childAgeBands,
      categories: catalogCategories,
      interestTags: parsed.data.interestTags,
      childFirstNames: parsed.data.childFirstNames,
      openToMeetParents: parsed.data.openToMeetParents,
      budgetBand: parsed.data.budgetBand,
      language: parsed.data.language,
    });
  } catch {
    return { ok: false, error: "Could not save preferences. Try again." };
  }

  revalidatePath("/account");
  return { ok: true };
}
