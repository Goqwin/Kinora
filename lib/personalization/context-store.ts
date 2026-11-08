/**
 * Where user context comes from:
 *  - Fresh onboarding answers in this request (anonymous or logged in): built
 *    per request with buildUserContext(). Nothing is stored server-side.
 *  - Logged in, no answers in this request: READ the team's `user_preferences`
 *    row (via `users.auth0_sub`) and rebuild the context from it.
 *
 * TODO: writing `user_preferences` is owned by the onboarding/login code.
 * Writes from here are pending agreement with the teammate who owns that table.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { userPreferences, users } from "./schema";
import { buildUserContext } from "./build-user-context";
import type { UserContext } from "./types";

/** "3-5" → 4 (band midpoint, whole years). The table stores bands, not exact ages. */
function bandToAge(band: string): number | null {
  const m = /^(\d+)\s*-\s*(\d+)$/.exec(band.trim());
  return m ? Math.floor((Number(m[1]) + Number(m[2])) / 2) : null;
}

export async function resolveUserContext(opts: {
  auth0Sub?: string | null;
  /** Fresh onboarding answers from this request, if any. */
  onboarding?: unknown;
}): Promise<{ context: UserContext; userId: string | null }> {
  const { auth0Sub, onboarding } = opts;

  const [user] = auth0Sub
    ? await db.select({ id: users.id }).from(users).where(eq(users.auth0Sub, auth0Sub)).limit(1)
    : [];
  const userId = user?.id ?? null;

  if (onboarding !== undefined || !userId) {
    return { context: buildUserContext(onboarding), userId };
  }

  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (!prefs) return { context: buildUserContext({}), userId };

  return {
    context: buildUserContext({
      postalCode: prefs.postalFsa,
      kidsAges: (prefs.childAgeBands ?? []).map(bandToAge).filter((a) => a !== null),
      needs: prefs.categories ?? [],
      budget: prefs.budgetBand,
      language: prefs.language,
    }),
    userId,
  };
}
