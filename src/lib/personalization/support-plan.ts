/**
 * The whole support-plan pipeline behind POST /api/support-plan:
 * crisis check → context → intent → merge → retrieve → plan → save (logged-in only).
 *
 * Safety net: crisis is decided by keywords before any AI; Gemini failures
 * fall back (intent) or yield plan: null, and ranked results still return.
 * The raw text is used in memory only — never stored, logged or returned.
 * Server-only.
 */
import { z } from "zod";
import { mergeContextWithIntent } from "./build-user-context";
import { resolveUserContext } from "./context-store";
import { detectCrisis } from "./crisis";
import { crisisResourcesFor, type CrisisResource } from "./crisis-resources";
import { extractIntent } from "./extract-intent";
import { generatePlan, type SupportPlan } from "./generate-plan";
import { retrieveResources, type RankedResource, type Relaxation } from "./retrieve";
import { savePlan } from "./save-plan";
import type { StructuredIntent } from "./types";

export const supportPlanRequestSchema = z.object({
  text: z.string().max(2000).optional().default(""),
  onboarding: z.unknown().optional(),
});

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
): Promise<SupportPlanResponse> {
  const text = body.text.trim();
  const keywordCrisis = detectCrisis(text); // before any Gemini call

  const { context, userId } = await resolveUserContext({ auth0Sub, onboarding: body.onboarding });
  const { intent, intentSource } = await extractIntent(text, context);
  const merged = mergeContextWithIntent(context, intent);
  const { results, relaxed } = await retrieveResources(merged, { scheduleNeeds: intent.scheduleNeeds });
  const plan = results.length ? await generatePlan(intent, results) : null;

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
    usedFallback: intentSource === "fallback" || (results.length > 0 && plan === null),
  };
}
