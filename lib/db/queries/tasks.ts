import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { resources, userTasks, type UserTask } from "@/lib/db/schema";

export type TaskListItem = UserTask & {
  resourceSlug: string | null;
  resourceName: string | null;
};

export async function listTasksForUser(userId: string): Promise<TaskListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      task: userTasks,
      resourceSlug: resources.slug,
      resourceName: resources.name,
    })
    .from(userTasks)
    .leftJoin(resources, eq(userTasks.resourceId, resources.id))
    .where(eq(userTasks.userId, userId))
    .orderBy(desc(userTasks.createdAt))
    .limit(100);

  return rows.map((row) => ({
    ...row.task,
    resourceSlug: row.resourceSlug,
    resourceName: row.resourceName,
  }));
}

export async function createTaskForUser(input: {
  userId: string;
  title: string;
  resourceId?: string | null;
}): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(userTasks)
    .values({
      userId: input.userId,
      title: input.title.slice(0, 200),
      resourceId: input.resourceId ?? null,
      status: "todo",
    })
    .returning({ id: userTasks.id });
  if (!row) throw new Error("Task insert failed");
  return row.id;
}

export async function toggleTaskStatusForUser(
  userId: string,
  taskId: string,
): Promise<{ ok: true; status: "todo" | "done" } | { ok: false }> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(userTasks)
    .where(and(eq(userTasks.id, taskId), eq(userTasks.userId, userId)))
    .limit(1);
  if (!existing) return { ok: false };

  const next = existing.status === "done" ? "todo" : "done";
  await db
    .update(userTasks)
    .set({
      status: next,
      completedAt: next === "done" ? new Date() : null,
    })
    .where(and(eq(userTasks.id, taskId), eq(userTasks.userId, userId)));

  return { ok: true, status: next };
}
