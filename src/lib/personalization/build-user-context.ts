/**
 * buildUserContext(): raw onboarding answers → normalized UserContext.
 *
 * Design rules:
 *  - Never throws on bad input. Each field is parsed independently; anything
 *    unusable is dropped, so a parent who skips everything still gets results.
 *  - Location is coarsened: postal code → FSA (first 3 chars) → area centre,
 *    rounded to 2 decimals (~1 km). The full postal code is not kept.
 *  - Pure function: no DB, no network. Persisting for logged-in users and
 *    session-only storage for anonymous users happen in the caller.
 */
import {
  BUDGET_LEVELS,
  BUDGET_MAX_MONTHLY_CAD,
  LANGUAGES,
  NEED_CATEGORIES,
  ageToBand,
  onboardingInputSchema,
  userContextSchema,
  type AgeBand,
  type BudgetLevel,
  type Language,
  type LlmSafeContext,
  type NeedCategory,
  type UserContext,
  type UserLocation,
} from "./types";
import {
  CALGARY_FSA_CENTROIDS,
  NEIGHBOURHOOD_TO_FSA,
  extractCalgaryFsa,
  normalizeNeighbourhood,
} from "./calgary-areas";

/* ---------------- field normalizers (exported for tests/reuse) ------------- */

const round2 = (n: number) => Math.round(n * 100) / 100;

const asString = (v: unknown, max = 80): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

const asStringArray = (v: unknown, max = 20): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, max) : [];

export function resolveLocation(
  postalCode?: string | null,
  neighbourhood?: string | null,
): UserLocation | null {
  if (postalCode) {
    const fsa = extractCalgaryFsa(postalCode);
    const c = fsa ? CALGARY_FSA_CENTROIDS[fsa] : undefined;
    if (fsa && c) {
      return { lat: round2(c.lat), lng: round2(c.lng), label: `${fsa} · ${c.label}`, source: "postal_fsa" };
    }
  }
  if (neighbourhood) {
    const key = normalizeNeighbourhood(neighbourhood);
    const fsa = NEIGHBOURHOOD_TO_FSA[key];
    const c = fsa ? CALGARY_FSA_CENTROIDS[fsa] : undefined;
    if (c) {
      return { lat: round2(c.lat), lng: round2(c.lng), label: c.label, source: "neighbourhood" };
    }
  }
  return null;
}

export function normalizeKidsAges(ages: unknown): number[] {
  if (!Array.isArray(ages)) return [];
  return ages
    .slice(0, 12)
    .map((a) => (typeof a === "string" && a.trim() !== "" ? Number(a) : a))
    .filter((a): a is number => typeof a === "number")
    .filter((a) => Number.isFinite(a) && a >= 0 && a < 18)
    .map((a) => Math.floor(a))
    .sort((a, b) => a - b);
}

/** Friendly labels the form or Gemini might send → canonical categories. */
const NEED_ALIASES: Record<string, NeedCategory> = {
  daycare: "childcare",
  "child care": "childcare",
  dayhome: "childcare",
  preschool: "childcare",
  "after school": "childcare",
  "before and after school": "childcare",
  subsidy: "financial_aid",
  "childcare subsidy": "financial_aid",
  money: "financial_aid",
  benefits: "financial_aid",
  "financial help": "financial_aid",
  "food bank": "food",
  groceries: "food",
  job: "employment",
  jobs: "employment",
  work: "employment",
  school: "education",
  esl: "education",
  parenting: "parenting_support",
  "support group": "parenting_support",
  counselling: "mental_health_support",
  counseling: "mental_health_support",
  "mental health": "mental_health_support",
  medical: "health",
  dental: "health",
  activities: "recreation",
  sports: "recreation",
  events: "community_events",
};

export function normalizeNeeds(needs?: string[] | null): NeedCategory[] {
  if (!needs) return [];
  const out = new Set<NeedCategory>();
  for (const raw of needs) {
    const key = raw.toLowerCase().trim().replace(/[-_]+/g, " ");
    const snake = key.replace(/\s+/g, "_");
    if ((NEED_CATEGORIES as readonly string[]).includes(snake)) out.add(snake as NeedCategory);
    else if (NEED_ALIASES[key]) out.add(NEED_ALIASES[key]);
  }
  return [...out];
}

const BUDGET_ALIASES: Record<string, BudgetLevel> = {
  free: "free_only",
  "0": "free_only",
  none: "free_only",
  "low cost": "low",
  cheap: "low",
  some: "moderate",
  medium: "moderate",
  any: "flexible",
  "no limit": "flexible",
};

export function normalizeBudget(budget?: string | null): BudgetLevel | null {
  if (!budget) return null;
  const key = budget.toLowerCase().trim().replace(/[-_]+/g, " ");
  const snake = key.replace(/\s+/g, "_");
  if ((BUDGET_LEVELS as readonly string[]).includes(snake)) return snake as BudgetLevel;
  return BUDGET_ALIASES[key] ?? null;
}

const LANGUAGE_NAMES: Record<string, Language> = {
  english: "en", french: "fr", français: "fr", francais: "fr", spanish: "es", español: "es",
  punjabi: "pa", chinese: "zh", mandarin: "zh", cantonese: "zh", tagalog: "tl", filipino: "tl",
  arabic: "ar", urdu: "ur", vietnamese: "vi", ukrainian: "uk", tigrinya: "ti", somali: "so",
  hindi: "hi", farsi: "fa", persian: "fa", dari: "fa",
};

export function normalizeLanguage(lang?: string | null): Language | null {
  if (!lang) return null;
  const key = lang.toLowerCase().trim();
  const iso = key.split(/[-_]/)[0] ?? ""; // "en-CA" → "en"
  if ((LANGUAGES as readonly string[]).includes(iso)) return iso as Language;
  return LANGUAGE_NAMES[key] ?? null;
}

/* ---------------------------- main entry point ---------------------------- */

export function buildUserContext(raw: unknown): UserContext {
  // Parse leniently: if the top-level shape is wrong, treat as "nothing answered".
  const parsed = onboardingInputSchema.safeParse(raw ?? {});
  const input = parsed.success ? parsed.data : {};

  const location = resolveLocation(asString(input.postalCode, 10), asString(input.neighbourhood));
  const kidsAges = normalizeKidsAges(input.kidsAges);
  const ageBands = [...new Set(kidsAges.map(ageToBand))] as AgeBand[];
  const needs = normalizeNeeds(asStringArray(input.needs));
  const budget = normalizeBudget(asString(input.budget, 30));
  const language = normalizeLanguage(asString(input.language, 20));

  const ctx: UserContext = {
    location,
    kidsAges,
    ageBands,
    needs,
    budget,
    maxMonthlyCostCad: budget ? BUDGET_MAX_MONTHLY_CAD[budget] : null,
    language,
    answered: {
      location: location !== null,
      kids: kidsAges.length > 0,
      needs: needs.length > 0,
      budget: budget !== null,
      language: language !== null,
    },
  };

  // Belt and braces: guarantees downstream code gets a valid shape.
  return userContextSchema.parse(ctx);
}

/**
 * Merge onboarding context with Gemini's structured intent (step 2).
 * Free text wins where the parent said something specific *now*
 * ("my 4-year-old"), onboarding fills the gaps. Categories are unioned.
 */
export function mergeContextWithIntent(
  ctx: UserContext,
  intent: {
    categories: NeedCategory[];
    kidsAges: number[];
    budget: BudgetLevel | null;
    language: Language | null;
  },
): UserContext {
  const kidsAges = intent.kidsAges.length ? normalizeKidsAges(intent.kidsAges) : ctx.kidsAges;
  const budget = intent.budget ?? ctx.budget;
  return userContextSchema.parse({
    ...ctx,
    kidsAges,
    ageBands: [...new Set(kidsAges.map(ageToBand))],
    needs: [...new Set([...intent.categories, ...ctx.needs])],
    budget,
    maxMonthlyCostCad: budget ? BUDGET_MAX_MONTHLY_CAD[budget] : null,
    language: intent.language ?? ctx.language,
  });
}

/** The only projection of UserContext allowed into a Gemini prompt. */
export function toLlmSafeContext(ctx: UserContext): LlmSafeContext {
  return {
    kidsAges: ctx.kidsAges,
    needs: ctx.needs,
    budget: ctx.budget,
    language: ctx.language,
    hasLocation: ctx.location !== null,
  };
}
