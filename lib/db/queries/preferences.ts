import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { userPreferences, type UserPreferences } from "@/lib/db/schema";

export type PreferencesUpsertInput = {
  userId: string;
  postalFsa: string | null;
  childAgeBands: string[];
  categories: string[];
  interestTags: string[];
  childFirstNames: string[];
  openToMeetParents: boolean;
  budgetBand: string | null;
  language: string;
};

export async function getPreferencesByUserId(
  userId: string,
): Promise<UserPreferences | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertPreferences(
  input: PreferencesUpsertInput,
): Promise<UserPreferences> {
  const db = getDb();
  const values = {
    userId: input.userId,
    postalFsa: input.postalFsa,
    childAgeBands: input.childAgeBands,
    categories: input.categories,
    interestTags: input.interestTags,
    childFirstNames: input.childFirstNames,
    openToMeetParents: input.openToMeetParents,
    budgetBand: input.budgetBand,
    language: input.language,
    updatedAt: new Date(),
  };

  const [row] = await db
    .insert(userPreferences)
    .values(values)
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        postalFsa: values.postalFsa,
        childAgeBands: values.childAgeBands,
        categories: values.categories,
        interestTags: values.interestTags,
        childFirstNames: values.childFirstNames,
        openToMeetParents: values.openToMeetParents,
        budgetBand: values.budgetBand,
        language: values.language,
        updatedAt: values.updatedAt,
      },
    })
    .returning();

  if (!row) throw new Error("Preferences upsert failed");
  return row;
}

/** Flip only the meet-parents flag; create a sparse prefs row if needed. */
export async function setOpenToMeetParents(
  userId: string,
  openToMeetParents: boolean,
): Promise<UserPreferences> {
  const existing = await getPreferencesByUserId(userId);
  if (existing) {
    const db = getDb();
    const [row] = await db
      .update(userPreferences)
      .set({
        openToMeetParents,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();
    if (!row) throw new Error("Preferences update failed");
    return row;
  }

  return upsertPreferences({
    userId,
    postalFsa: null,
    childAgeBands: [],
    categories: [],
    interestTags: [],
    childFirstNames: [],
    openToMeetParents,
    budgetBand: null,
    language: "en",
  });
}
