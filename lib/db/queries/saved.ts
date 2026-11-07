import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { resources, savedResources } from "@/lib/db/schema";

import { getResourceBySlugFromDb } from "./resources";

export type SavedResourceItem = {
  resourceId: string;
  slug: string;
  name: string;
  category: string;
  savedAt: Date;
};

export async function listSavedResourcesForUser(
  userId: string,
): Promise<SavedResourceItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      resourceId: resources.id,
      slug: resources.slug,
      name: resources.name,
      category: resources.category,
      savedAt: savedResources.createdAt,
    })
    .from(savedResources)
    .innerJoin(resources, eq(savedResources.resourceId, resources.id))
    .where(eq(savedResources.userId, userId))
    .orderBy(desc(savedResources.createdAt));

  return rows.map((row) => ({
    resourceId: row.resourceId,
    slug: row.slug,
    name: row.name,
    category: row.category,
    savedAt: row.savedAt ?? new Date(),
  }));
}

export async function isResourceSavedByUser(
  userId: string,
  resourceId: string,
): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ resourceId: savedResources.resourceId })
    .from(savedResources)
    .where(
      and(
        eq(savedResources.userId, userId),
        eq(savedResources.resourceId, resourceId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function saveResourceForUser(
  userId: string,
  resourceSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resource = await getResourceBySlugFromDb(resourceSlug);
  if (!resource?.id) {
    return { ok: false, error: "Resource not found." };
  }
  const db = getDb();
  await db
    .insert(savedResources)
    .values({
      userId,
      resourceId: resource.id,
    })
    .onConflictDoNothing();
  return { ok: true };
}

export async function unsaveResourceForUser(
  userId: string,
  resourceSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resource = await getResourceBySlugFromDb(resourceSlug);
  if (!resource?.id) {
    return { ok: false, error: "Resource not found." };
  }
  const db = getDb();
  await db
    .delete(savedResources)
    .where(
      and(
        eq(savedResources.userId, userId),
        eq(savedResources.resourceId, resource.id),
      ),
    );
  return { ok: true };
}
