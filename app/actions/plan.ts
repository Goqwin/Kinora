"use server";

import { z } from "zod";

import { getOptionalUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { persistSupportPlan } from "@/lib/db/queries/plans";
import type { SupportPlanCriteria } from "@/lib/db/schema-constants";
import { runSearch } from "@/lib/search/run-search";
import type { SearchRequest } from "@/lib/search/parse-request";

const persistSchema = z.object({
  text: z.string().optional(),
  postal: z.string().optional(),
  radiusKm: z.coerce.number().optional(),
  categories: z.string().optional(),
  childAgeYears: z.coerce.number().nullable().optional(),
  costPreference: z.enum(["free", "subsidized"]).nullable().optional(),
});

export async function persistPlanFromSearchAction(
  input: z.infer<typeof persistSchema>,
): Promise<{ ok: true; planId: string } | { ok: false; error: string }> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in to save your plan." };
  }

  const parsed = persistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid plan input." };
  }

  const searchInput: SearchRequest = {
    text: parsed.data.text,
    postal: parsed.data.postal,
    radiusKm: parsed.data.radiusKm ?? 15,
    categories: parsed.data.categories ? [parsed.data.categories] : undefined,
    childAgeYears: parsed.data.childAgeYears ?? null,
    costPreference: parsed.data.costPreference ?? null,
  };

  try {
    const payload = await runSearch(searchInput);
    const criteria: SupportPlanCriteria = {
      categories: payload.criteria.categories as SupportPlanCriteria["categories"],
      child_age_bands: payload.criteria.childAgeBands,
      cost_preference: payload.criteria.costPreference,
      urgency: payload.criteria.urgency,
      language: payload.criteria.language,
      summary: payload.plan.summary,
      radius_km: payload.criteria.radiusKm,
    };
    const planId = await persistSupportPlan({
      userId: user.id,
      criteria,
      actions: payload.plan.actions,
    });
    return { ok: true, planId };
  } catch {
    return { ok: false, error: "Could not save your plan. Try again later." };
  }
}
