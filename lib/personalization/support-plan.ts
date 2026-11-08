/**
 * The whole support-plan pipeline behind the live /plan search (via lib/search):
 * crisis check → context → intent → merge → retrieve → plan → save (logged-in only).
 *
 * Safety net: crisis is decided by keywords before any AI; Gemini failures
 * fall back (intent) or yield plan: null, and ranked results still return.
 * Time budget: the whole run aims for ~10 s. If the intent call leaves too
 * little time for the plan call, the plan call is skipped (plan: null).
 * The raw text is used in memory only — never stored, logged or returned.
 * Server-only.
 */
import { z } from "zod";
import { mergeContextWithIntent } from "./build-user-context";
import { resolveUserContext } from "./context-store";
import { detectCrisis } from "./crisis";
import { crisisResourcesFor, type CrisisResource } from "./crisis-resources";
import { extractIntent, keywordIntent } from "./extract-intent";
import { generatePlan, type SupportPlan } from "./generate-plan";
import { retrieveResources, type RankedResource, type Relaxation } from "./retrieve";
import { savePlan } from "./save-plan";
import type { StructuredIntent } from "./types";

const MIN_WORDS_FOR_AI = 3;
const TIME_BUDGET_MS = 10_000;
/** Below this much time left, the plan call is skipped instead of started. */
const MIN_PLAN_MS = 3_000;

export const supportPlanRequestSchema = z.object({
  text: z.string().max(2000).optional().default(""),
  onboarding: z.unknown().optional(),
});

export type SupportPlanOptions = {
  radiusKm?: number;
  /** false = never call Gemini (the AI_ENABLED switch). Default true. */
  aiEnabled?: boolean;
  timeBudgetMs?: number;
};

export type SupportPlanResponse = {
  crisis: boolean;
  crisisResources: CrisisResource[];
  intent: StructuredIntent;
  results: RankedResource[];
  relaxed: Relaxation[];
  plan: SupportPlan | null;
  usedFallback: boolean;
};

export async function buildSupportPlan(
  body: z.infer<typeof supportPlanRequestSchema>,
  auth0Sub: string | null,
  opts: SupportPlanOptions = {},
): Promise<SupportPlanResponse> {
  const started = Date.now();
  const timeLeft = () => (opts.timeBudgetMs ?? TIME_BUDGET_MS) - (Date.now() - started);
  const text = body.text.trim();
  const keywordCrisis = detectCrisis(text); // before any Gemini call

  // Empty or very short text (< 3 words), or AI switched off: skip both Gemini
  // calls. Keywords still catch crisis words and simple needs ("need daycare").
  const skipAi = opts.aiEnabled === false || text.split(/\s+/).filter(Boolean).length < MIN_WORDS_FOR_AI;

  const { context, userId } = await resolveUserContext({ auth0Sub, onboarding: body.onboarding });
  const { intent, intentSource } = skipAi
    ? { intent: keywordIntent(text), intentSource: "fallback" as const }
    : await extractIntent(text, context, undefined, timeLeft());
  const merged = mergeContextWithIntent(context, intent);
  const { results, relaxed } = await retrieveResources(merged, {
    scheduleNeeds: intent.scheduleNeeds,
    radiusKm: opts.radiusKm,
  });
  const planTime = timeLeft();
  const plan =
    !skipAi && results.length && planTime >= MIN_PLAN_MS
      ? await generatePlan(intent, results, undefined, planTime)
      : null;

  if (userId) {
    try {
      await savePlan(userId, intent, plan);
    } catch (e) {
      // Saving is best-effort: the parent still gets their results. No text logged.
      console.warn("support-plan: save failed:", e instanceof Error ? e.name : typeof e);
    }
  }

  const signals = [...new Set([...keywordCrisis.signals, ...intent.crisisSignals])];
  const crisis = signals.length > 0;
  return {
    crisis,
    crisisResources: crisis ? crisisResourcesFor(signals) : [],
    intent,
    results,
    relaxed,
    plan,
    // True when Gemini was tried but failed or ran out of time; a deliberate skip is not a fallback.
    usedFallback: !skipAi && (intentSource === "fallback" || (results.length > 0 && plan === null)),
  };
}
