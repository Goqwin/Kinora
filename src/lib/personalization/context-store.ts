/**
 * Where user context lives:
 *  - Logged in (Auth0 session present): normalized UserContext upserted to
 *    `user_contexts`, keyed by auth0 `sub`.
 *  - Anonymous: NOTHING is stored server-side. The client keeps raw onboarding
 *    answers in sessionStorage and sends them with each request; we rebuild
 *    the context per request (it's a pure, sub-millisecond function).
 */
import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { userContexts } from "../../db/schema/personalization";
import { buildUserContext } from "./build-user-context";
import { userContextSchema, type UserContext } from "./types";

export async function resolveUserContext(opts: {
  auth0Sub?: string | null;
  /** Fresh onboarding answers from this request, if any. */
  onboarding?: unknown;
}): Promise<{ context: UserContext; id: string | null }> {
  const { auth0Sub, onboarding } = opts;

  if (!auth0Sub) {
    return { context: buildUserContext(onboarding), id: null };
  }

  if (onboarding !== undefined) {
    const context = buildUserContext(onboarding);
    const [row] = await db
      .insert(userContexts)
      .values({ auth0Sub, context })
      .onConflictDoUpdate({
        target: userContexts.auth0Sub,
        set: { context, updatedAt: sql`now()` },
      })
      .returning({ id: userContexts.id });
    return { context, id: row?.id ?? null };
  }

  const [row] = await db.select().from(userContexts).where(eq(userContexts.auth0Sub, auth0Sub)).limit(1);
  const parsed = row ? userContextSchema.safeParse(row.context) : null;
  return parsed?.success
    ? { context: parsed.data, id: row!.id }
    : { context: buildUserContext({}), id: row?.id ?? null };
}
