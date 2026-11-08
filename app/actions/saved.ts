"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOptionalUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  saveResourceForUser,
  unsaveResourceForUser,
} from "@/lib/db/queries/saved";

const slugSchema = z.string().min(1).max(120);

export async function toggleSavedResourceAction(
  resourceSlug: string,
  saved: boolean,
): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }> {
  const slug = slugSchema.safeParse(resourceSlug);
  if (!slug.success) {
    return { ok: false, error: "Invalid resource." };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in to save resources." };
  }

  const result = saved
    ? await unsaveResourceForUser(user.id, slug.data)
    : await saveResourceForUser(user.id, slug.data);

  if (!result.ok) {
    return result;
  }

  revalidatePath("/saved");
  revalidatePath(`/resources/${slug.data}`);
  return { ok: true, saved: !saved };
}
