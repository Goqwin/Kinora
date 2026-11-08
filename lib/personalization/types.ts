/**
 * Shared types + Zod schemas for the personalization pipeline.
 *
 * One source of truth: the Supabase CHECK constraints, the onboarding form, Gemini's
 * structured-intent output (step 2) and the retrieval query (step 3) all
 * import from here, so a category or budget level can't drift between layers.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Vocabularies                                                        */
/* ------------------------------------------------------------------ */

/** Must match the CHECK constraint on Supabase `resources.category`. */
export const NEED_CATEGORIES = [
  "childcare", // daycare, dayhomes, preschool, before/after-school care
  "financial", // benefits, childcare subsidies, emergency funds
  "housing", // rental assistance, affordable housing, eviction prevention
  "food", // food banks, meal programs
  "health_family", // clinics, counselling, family services (we list, never advise)
  "community", // peer groups, parenting programs, newcomer and outreach services
  "activities", // low-cost kids' activities and events
  "legal_info", // legal clinics (we list, never advise)
] as const;
export const needCategorySchema = z.enum(NEED_CATEGORIES);
export type NeedCategory = z.infer<typeof needCategorySchema>;

/** What the parent can spend on a service. */
export const BUDGET_LEVELS = ["free_only", "low", "moderate", "flexible"] as const;
export const budgetLevelSchema = z.enum(BUDGET_LEVELS);
export type BudgetLevel = z.infer<typeof budgetLevelSchema>;

/** Languages we can realistically match resources on. ISO 639-1. */
export const LANGUAGES = [
  "en", "fr", "es", "pa", "zh", "tl", "ar", "ur", "vi", "uk", "ti", "so", "hi", "fa",
] as const;
export const languageSchema = z.enum(LANGUAGES);
export type Language = z.infer<typeof languageSchema>;

/** Must match the CHECK constraint on Supabase `resources.cost_type`. */
export const COST_TYPES = ["free", "subsidized", "income_based", "paid"] as const;
export const costTypeSchema = z.enum(COST_TYPES);
export type CostType = z.infer<typeof costTypeSchema>;

/**
 * Cost types each budget allows. Even "free_only" allows subsidized and
 * income-based: a parent who can't pay may be eligible for reduced cost.
 * Retrieval still scores free highest.
 */
export const BUDGET_COST_TYPES: Record<BudgetLevel, CostType[]> = {
  free_only: ["free", "subsidized", "income_based"],
  low: ["free", "subsidized", "income_based"],
  moderate: ["free", "subsidized", "income_based", "paid"],
  flexible: ["free", "subsidized", "income_based", "paid"],
};

/** UI copy for reduced-cost resources. Never say "eligible" outright. */
export const REDUCED_COST_LABEL = "May be eligible for reduced cost";

/** Must match the CHECK constraint on Supabase `resources.schedule`. */
export const SCHEDULE_TAGS = ["evenings", "overnight", "weekends", "drop_in"] as const;
export type ScheduleTag = (typeof SCHEDULE_TAGS)[number];

export const URGENCY_LEVELS = ["low", "medium", "high", "crisis"] as const;
export const urgencySchema = z.enum(URGENCY_LEVELS);
export type Urgency = z.infer<typeof urgencySchema>;

/** Child-age bands used for display and for coarse matching. */
export const AGE_BANDS = ["infant", "toddler", "preschool", "school_age", "teen"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export function ageToBand(age: number): AgeBand {
  if (age < 1) return "infant";
  if (age < 3) return "toddler";
  if (age < 6) return "preschool";
  if (age < 13) return "school_age";
  return "teen";
}

/* ------------------------------------------------------------------ */
/* Onboarding input (raw, from the form — everything optional)         */
/* ------------------------------------------------------------------ */

/**
 * Lenient on purpose: every field is `unknown` and validated on its own in
 * buildUserContext, so one bad value (a NaN age, a typo'd budget) drops only
 * that value — never the parent's other answers.
 */
export const onboardingInputSchema = z.object({
  postalCode: z.unknown(),
  neighbourhood: z.unknown(),
  kidsAges: z.unknown(),
  needs: z.unknown(),
  budget: z.unknown(),
  language: z.unknown(),
}).partial();
export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

/* ------------------------------------------------------------------ */
/* UserContext (normalized, server-side)                               */
/* ------------------------------------------------------------------ */

export const userLocationSchema = z.object({
  /** Coarsened to ~1 km (2 decimals). Never an exact address. */
  lat: z.number().min(50.8).max(51.3),
  lng: z.number().min(-114.4).max(-113.8),
  /** Human label for UI: "T2R area" / "Beltline". */
  label: z.string(),
  source: z.enum(["postal_fsa", "neighbourhood"]),
});
export type UserLocation = z.infer<typeof userLocationSchema>;

export const userContextSchema = z.object({
  location: userLocationSchema.nullable(),
  /** Whole years, 0–17, sorted ascending. */
  kidsAges: z.array(z.number().int().min(0).max(17)),
  ageBands: z.array(z.enum(AGE_BANDS)),
  needs: z.array(needCategorySchema),
  budget: budgetLevelSchema.nullable(),
  language: languageSchema.nullable(),
  /** Which fields the parent actually answered — drives "tell us more" prompts. */
  answered: z.object({
    location: z.boolean(),
    kids: z.boolean(),
    needs: z.boolean(),
    budget: z.boolean(),
    language: z.boolean(),
  }),
});
export type UserContext = z.infer<typeof userContextSchema>;

/**
 * The ONLY slice of user context that may be sent to Gemini.
 * No location coordinates, no postal code, no IDs. Ages only.
 */
export type LlmSafeContext = {
  kidsAges: number[];
  needs: NeedCategory[];
  budget: BudgetLevel | null;
  language: Language | null;
  hasLocation: boolean;
};

/* ------------------------------------------------------------------ */
/* Structured intent (Gemini output in step 2; stored in               */
/* support_plans.criteria for logged-in users)                         */
/* ------------------------------------------------------------------ */

export const structuredIntentSchema = z.object({
  categories: z.array(needCategorySchema).max(6),
  kidsAges: z.array(z.number().int().min(0).max(17)).max(12),
  budget: budgetLevelSchema.nullable(),
  urgency: urgencySchema,
  language: languageSchema.nullable(),
  /** Scheduling constraints, e.g. works nights → needs evening/overnight care. */
  scheduleNeeds: z.array(z.enum(SCHEDULE_TAGS)).max(4),
  /** Short, PII-free paraphrase for the UI ("Night-shift childcare for a preschooler"). */
  summary: z.string().max(160),
  /** Set by Gemini and/or the keyword check; never inferred loosely. */
  crisisSignals: z.array(z.enum(["danger", "abuse", "self_harm", "no_shelter_tonight"])).max(4),
});
export type StructuredIntent = z.infer<typeof structuredIntentSchema>;
