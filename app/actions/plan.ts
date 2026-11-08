"use server";

import { z } from "zod";

import { getOptionalUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { persistSupportPlan } from "@/lib/db/queries/plans";
import { CHILD_AGE_BANDS, type SupportPlanCriteria } from "@/lib/db/schema-constants";
import { RESOURCE_CATEGORIES } from "@/lib/resources/types";

/**
 * The plan the parent is already looking at: structured data only. The
 * parent's free text is never sent here, and nothing is re-run.
 */
const shownPlanSchema = z.object({
  criteria: z.object({
    categories: z.array(z.enum(RESOURCE_CATEGORIES)).max(8),
    childAgeBands: z.array(z.enum(CHILD_AGE_BANDS)).max(5),
    costPreference: z.enum(["free", "subsidized", "any"]).nullable(),
    urgency: z.enum(["low", "medium", "high"]).nullable(),
    language: z.string().max(10).nullable(),
    radiusKm: z.number().min(1).max(50),
  }),
  summary: z.string().max(300),
  actions: z
    .array(
      z.object({
        resourceSlug: z.string().min(1).max(200),
        title: z.string().min(1).max(200),
        reason: z.string().max(600),
        firstStep: z.string().max(300),
        priority: z.number().int().min(1).max(10),
      }),
    )
    .max(6),
});

export type ShownPlan = z.infer<typeof shownPlanSchema>;

export async function saveShownPlanAction(
  input: ShownPlan,
): Promise<{ ok: true; planId: string } | { ok: false; error: string }> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in to save your plan." };
  }

  const parsed = shownPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid plan input." };
  }

  const { criteria: c, summary, actions } = parsed.data;
  const criteria: SupportPlanCriteria = {
    categories: c.categories,
    child_age_bands: c.childAgeBands,
    cost_preference: c.costPreference,
    urgency: c.urgency,
    language: c.language,
    summary,
    radius_km: c.radiusKm,
  };

  try {
    const planId = await persistSupportPlan({ userId: user.id, criteria, actions });
    return { ok: true, planId };
  } catch {
    return { ok: false, error: "Could not save your plan. Try again later." };
  }
}
