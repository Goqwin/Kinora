import "server-only";

import { redirect } from "next/navigation";

import { getAuth0, isAuthConfigured } from "@/lib/auth/auth0-client";
import { safeReturnPath } from "@/lib/auth/paths";
import { isDatabaseConfigured } from "@/lib/db";
import { upsertUserFromAuth0 } from "@/lib/db/queries/users";
import { adminSubs } from "@/lib/env";

export { isAuthConfigured };

export type AppUser = {
  id: string;
  auth0Sub: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "admin";
};

export async function getOptionalUser(): Promise<AppUser | null> {
  const auth0 = getAuth0();
  if (!auth0) return null;

  const session = await auth0.getSession();
  const sub = session?.user?.sub;
  if (!sub) return null;

  const email =
    typeof session.user.email === "string" ? session.user.email : null;
  const displayName =
    typeof session.user.name === "string" ? session.user.name : null;
  const role = roleForAuth0Sub(sub);

  if (isDatabaseConfigured()) {
    try {
      const row = await upsertUserFromAuth0({
        auth0Sub: sub,
        email,
        displayName,
        role,
      });
      return {
        id: row.id,
        auth0Sub: row.auth0Sub,
        email: row.email,
        displayName: row.displayName,
        role: row.role === "admin" ? "admin" : "user",
      };
    } catch {
      /* fall back to session-only identity */
    }
  }

  return {
    id: sub,
    auth0Sub: sub,
    email,
    displayName,
    role,
  };
}

export async function requireUser(returnPath?: string): Promise<AppUser> {
  const user = await getOptionalUser();
  if (user) return user;
  const path = returnPath ? `?returnTo=${encodeURIComponent(safeReturnPath(returnPath))}` : "";
  redirect(`/account${path}`);
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser("/admin/moderation");
  if (user.role !== "admin") redirect("/");
  return user;
}

export function roleForAuth0Sub(auth0Sub: string): "user" | "admin" {
  return adminSubs().includes(auth0Sub) ? "admin" : "user";
}
