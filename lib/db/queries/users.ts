import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

export async function getUserByAuth0Sub(auth0Sub: string): Promise<User | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.auth0Sub, auth0Sub))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertUserFromAuth0(input: {
  auth0Sub: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "admin";
}): Promise<User> {
  const db = getDb();
  const existing = await getUserByAuth0Sub(input.auth0Sub);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        email: input.email ?? existing.email,
        role: input.role,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      auth0Sub: input.auth0Sub,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
    })
    .returning();
  if (!created) {
    throw new Error("User insert failed");
  }
  return created;
}
