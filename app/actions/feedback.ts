"use server";

import { z } from "zod";

import { getOptionalUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getDb } from "@/lib/db";
import { resourceFeedback } from "@/lib/db/schema";
import { getResourceIdBySlug } from "@/lib/db/queries/resources";
import { RESOURCE_FEEDBACK_TYPES } from "@/lib/db/schema-constants";

const feedbackSchema = z.object({
  resourceSlug: z.string().min(1).max(120),
  type: z.enum(RESOURCE_FEEDBACK_TYPES),
  note: z.string().max(500).optional(),
});

export async function submitResourceFeedbackAction(
  input: z.infer<typeof feedbackSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the feedback form." };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  const resourceId = await getResourceIdBySlug(parsed.data.resourceSlug);
  if (!resourceId) {
    return { ok: false, error: "Resource not found." };
  }

  const user = await getOptionalUser();

  try {
    const db = getDb();
    await db.insert(resourceFeedback).values({
      resourceId,
      userId: user?.id ?? null,
      type: parsed.data.type,
      note: parsed.data.note?.trim() || null,
      status: "open",
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send feedback. Try again later." };
  }
}
