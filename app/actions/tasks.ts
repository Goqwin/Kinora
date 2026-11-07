"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  createTaskForUser,
  toggleTaskStatusForUser,
} from "@/lib/db/queries/tasks";

const createSchema = z.object({
  title: z.string().min(2).max(200),
  resourceId: z.string().uuid().nullable().optional(),
});

const toggleSchema = z.object({
  taskId: z.string().uuid(),
});

export async function createTaskAction(
  input: z.infer<typeof createSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Task title must be 2 to 200 characters." };
  }
  const user = await requireUser("/saved");
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }
  try {
    await createTaskForUser({
      userId: user.id,
      title: parsed.data.title,
      resourceId: parsed.data.resourceId ?? null,
    });
    revalidatePath("/saved");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not create the task." };
  }
}

export async function toggleTaskAction(
  input: z.infer<typeof toggleSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid task." };
  }
  const user = await requireUser("/saved");
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }
  try {
    const result = await toggleTaskStatusForUser(user.id, parsed.data.taskId);
    if (!result.ok) {
      return { ok: false, error: "Task not found." };
    }
    revalidatePath("/saved");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the task." };
  }
}
