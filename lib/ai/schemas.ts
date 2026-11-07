import { z } from "zod";

import { CHILD_AGE_BANDS, RESOURCE_CATEGORIES } from "@/lib/db/schema-constants";

export const PROMPT_VERSION = "criteria-v2";

export const criteriaSchema = z.object({
  categories: z.array(z.enum(RESOURCE_CATEGORIES)).max(4),
  child_age_bands: z.array(z.enum(CHILD_AGE_BANDS)).max(5),
  child_count: z.number().int().min(0).max(10).nullable(),
  cost_preference: z.enum(["free", "subsidized", "any"]).nullable(),
  urgency: z.enum(["low", "medium", "high"]).nullable(),
  schedule_notes: z
    .enum(["evenings", "weekends", "overnight", "standard", "unknown"])
    .nullable(),
  language: z.string().max(10).nullable(),
  neighbourhood_mentioned: z.string().max(60).nullable(),
  summary: z.string().max(200),
});

export type AiCriteria = z.infer<typeof criteriaSchema>;
