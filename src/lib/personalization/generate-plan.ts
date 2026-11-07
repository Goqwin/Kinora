/**
 * Grounded support plan. Gemini sees ONLY the structured intent and the
 * retrieved records (no contact info, addresses or locations) and may only
 * point to those records. The output is validated step by step:
 *  - resourceIds not in the retrieved set are dropped; steps left empty are dropped
 *  - phone numbers, emails and URLs are stripped from the text (the UI shows
 *    contact info from the database instead)
 *  - "eligible" claims are softened to "may be eligible"
 * Returns null if nothing valid remains. Never throws. Does not save anything.
 */
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { RankedResource } from "./retrieve";
import type { StructuredIntent } from "./types";

export type PlanStep = { title: string; reason: string; firstStep: string; priority: number; resourceIds: string[] };
export type SupportPlan = { steps: PlanStep[] };
export type GenerateFn = (prompt: string, signal: AbortSignal) => Promise<string>;

const TIMEOUT_MS = 10000;

const stepSchema = z.object({
  title: z.string().min(1).max(80),
  reason: z.string().min(1).max(200),
  firstStep: z.string().min(1).max(160),
  priority: z.number().int().min(0),
  resourceIds: z.array(z.string()).min(1).max(4),
});
const planSchema = z.object({ steps: z.array(stepSchema).min(3).max(6) });

const PLAN_JSON_SCHEMA = (() => {
  const { $schema: _, ...schema } = z.toJSONSchema(planSchema) as Record<string, unknown>;
  return schema;
})();

const SYSTEM = `You write a short, practical support plan for a single parent in Calgary.
Rules:
- Use ONLY the resources provided. Every step must cite 1-4 of their ids in resourceIds, copied exactly.
- Never invent resources, eligibility rules, phone numbers, emails or URLs. Do not include any contact details.
- No legal, medical or mental-health advice. Only point to the listed resources.
- Say "may be eligible", never that the parent "is eligible".
- 3 to 6 steps. priority 1 = do first.
- title: short. reason: one line on why this fits their situation. firstStep: one short action, e.g. "Ask about evening spots".`;

async function callGemini(prompt: string, signal: AbortSignal): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) throw new Error("Gemini not configured");
  const res = await new GoogleGenAI({ apiKey }).models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      responseJsonSchema: PLAN_JSON_SCHEMA,
      temperature: 0.2,
      abortSignal: signal,
    },
  });
  return res.text ?? "";
}

const CONTACT_FALLBACK = "Contact them using the details shown";

/**
 * Remove emails, URLs and phone numbers (incl. N11/988 short codes). Connector
 * words right before a removed item ("at", "via", ":") go too. If nothing
 * useful is left (e.g. just "Call"), use a neutral line pointing at the
 * database contact details the UI shows.
 */
export function stripContactInfo(text: string): string {
  const CUT = "\u0000";
  const marked = text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, CUT)
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+|\b[\w-]+(\.[\w-]+)*\.(com|ca|org|net|gov|info)\b(\/[^\s,;)]*)?/gi, CUT)
    .replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b|\b[2-9]-?1-?1\b|\b988\b/g, CUT);
  if (!marked.includes(CUT)) return text.trim();

  const out = marked
    .replace(/\s*(\b(at|via|on|or)\b\s*)?:?\s*\u0000(\s*(,|or|and)\s*\u0000)*/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;:.-]+|[\s,;:-]+$/g, "")
    .trim();
  // Nothing left but verbs/connectors ("Call", "Email or call them")?
  return /^(\s|\b(call|email|phone|text|dial|visit|contact|reach|them|us|or|and|at|via)\b)*$/i.test(out) ? CONTACT_FALLBACK : out;
}

const softenEligibility = (s: string) =>
  s.replace(/\b(you|they|your family)( are|'re| will be)\s+eligible\b/gi, (_, who: string) => `${who} may be eligible`);

const clean = (s: string) => softenEligibility(stripContactInfo(s));

/** Only the fields Gemini may see. No address, phone, email, website or location. */
function toPlanRecord(r: RankedResource) {
  const years = (m: number | null) => (m === null ? null : Math.floor(m / 12));
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    cost: r.costLabel,
    ageYears: r.ageMinMonths === null && r.ageMaxMonths === null ? "any" : `${years(r.ageMinMonths) ?? 0}-${years(r.ageMaxMonths) ?? 17}`,
    eligibilityNotes: r.eligibilitySummary,
    schedule: r.schedule,
  };
}

export async function generatePlan(
  intent: StructuredIntent,
  resources: RankedResource[],
  generate: GenerateFn = callGemini,
): Promise<SupportPlan | null> {
  if (!resources.length) return null;
  const allowed = new Set(resources.map((r) => r.id));
  const prompt = JSON.stringify({
    need: { categories: intent.categories, kidsAges: intent.kidsAges, budget: intent.budget, scheduleNeeds: intent.scheduleNeeds, summary: intent.summary },
    resources: resources.slice(0, 10).map(toPlanRecord),
  });

  let rawSteps: unknown[];
  try {
    const json = JSON.parse(await generate(prompt, AbortSignal.timeout(TIMEOUT_MS)));
    rawSteps = Array.isArray(json?.steps) ? json.steps : [];
  } catch (e) {
    console.warn("generate-plan: Gemini failed:", e instanceof Error ? e.name : typeof e, (e as { status?: number })?.status ?? "");
    return null;
  }

  // Validate each step on its own so one bad step doesn't sink the plan.
  const steps = rawSteps
    .map((s) => stepSchema.safeParse(s))
    .filter((p) => p.success)
    .map((p) => ({ ...p.data, resourceIds: [...new Set(p.data.resourceIds.filter((id) => allowed.has(id)))] }))
    .filter((s) => s.resourceIds.length > 0)
    .map((s) => ({ ...s, title: clean(s.title), reason: clean(s.reason), firstStep: clean(s.firstStep) }))
    .filter((s) => s.title && s.reason && s.firstStep)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 6)
    .map((s, i) => ({ ...s, priority: i + 1 }));

  if (rawSteps.length && steps.length < rawSteps.length) {
    console.warn(`generate-plan: dropped ${rawSteps.length - steps.length} invalid step(s)`);
  }
  return steps.length ? { steps } : null;
}
