/**
 * Raw free text → StructuredIntent. Order: crisis keyword check → strip PII →
 * Gemini (JSON schema, Zod-validated, ~8s timeout) → keyword fallback on any
 * failure. Gemini only sees the redacted text + toLlmSafeContext() (ages, no
 * location). The raw text is never stored or logged. Server-only.
 */
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { toLlmSafeContext } from "./build-user-context";
import { detectCrisis } from "./crisis";
import { structuredIntentSchema, type NeedCategory, type ScheduleTag, type StructuredIntent, type UserContext } from "./types";

export type IntentResult = { intent: StructuredIntent; intentSource: "gemini" | "fallback" };
export type GenerateFn = (prompt: string, signal: AbortSignal) => Promise<string>;

const TIMEOUT_MS = 8000;

/** Remove emails, phone numbers, postal codes, street addresses and self-introductions. */
export function redactPii(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, "[phone]")
    .replace(/\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/g, "[postal code]")
    .replace(
      /\b\d{1,6}[a-z]?\s+(?:[A-Za-z0-9.'-]+\s+){0,4}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|way|crescent|cres|court|ct|lane|ln|trail|place|pl|close|gate|green|heights|park|square)\b\.?(?:\s+(?:nw|ne|sw|se))?/gi,
      "[address]",
    )
    .replace(/\b(my name is|i am called|i'm called)\s+[\w'-]+/gi, "$1 [name]")
    // "I'm Dana", "this is Dana", "call me Dana". Capitalised word only, so a
    // false positive like "I'm Tired" is possible (accepted).
    .replace(/\b(I'm|I’m|I am|[Cc]all me|[Tt]his is)\s+[A-Z][\w'-]*(\s+[A-Z][\w'-]*)?/g, "$1 [name]");
}

const SYSTEM = `You classify a single parent's request for support in Calgary into JSON.
Rules:
- Only fill the schema. Never invent resources, organisations, phone numbers, URLs or eligibility rules.
- categories: only those the parent actually needs, from the allowed list.
- kidsAges: whole years, only ages stated in the message (empty if none; context ages are merged later).
- budget: "free_only" if they say they can't afford it or need free help; "low" for low-cost; null if not mentioned.
- scheduleNeeds: "evenings" and/or "overnight" for night or evening work; "weekends"; "drop_in" for short-notice care.
- urgency: "crisis" only for danger, abuse, self-harm or no shelter tonight; "high" for needs today; else "medium" or "low".
- crisisSignals: only when explicitly stated. Do not guess.
- summary: under 160 characters, no names, places or contact details, e.g. "Night-shift childcare for a preschooler".
- Give no advice of any kind (legal, medical, mental-health).`;

const INTENT_JSON_SCHEMA = (() => {
  // Gemini rejects the "$schema" keyword.
  const schema: Record<string, unknown> = { ...z.toJSONSchema(structuredIntentSchema) };
  delete schema.$schema;
  return schema;
})();

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
      responseJsonSchema: INTENT_JSON_SCHEMA,
      temperature: 0,
      // Lowest thinking level Gemini 3 allows: faster, and these are simple JSON tasks.
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      abortSignal: signal,
    },
  });
  return res.text ?? "";
}

/* ----------------------------- keyword fallback ---------------------------- */

const CATEGORY_KEYWORDS: [NeedCategory, RegExp][] = [
  ["childcare", /daycare|day care|child ?care|babysit|preschool|day ?home|after.?school|nanny/],
  ["financial", /subsid|benefit|financial|money|bills|income|pay (for|the)/],
  ["housing", /housing|rent\b|evict|landlord|apartment|shelter|homeless/],
  ["food", /food|groceries|hungry|meals?\b/],
  ["health_family", /doctor|dentist|health|counsel|therap|sick|clinic/],
  ["community", /lonely|isolated|support group|parenting|other parents|newcomer/],
  ["activities", /activit|sport|swim|camp|club|art class/],
  ["legal_info", /legal|lawyer|custody|court|divorce|separation/],
];

const SCHEDULE_KEYWORDS: [ScheduleTag[], RegExp][] = [
  [["evenings", "overnight"], /\bnights?\b|night shift|graveyard/],
  [["evenings"], /evening/],
  [["overnight"], /overnight/],
  [["weekends"], /weekend|saturday|sunday/],
  [["drop_in"], /drop.?in|last.?minute|short notice/],
];

export function keywordIntent(text: string): StructuredIntent {
  const t = text.toLowerCase().replace(/[‘’]/g, "'");
  const categories = CATEGORY_KEYWORDS.filter(([, re]) => re.test(t)).map(([c]) => c);
  // "4-year-old", "18 month old", "7 and 10 year olds", "3, 5 and 8 yr olds"
  const kidsAges = [...t.matchAll(/\b(\d{1,2}(?:\s*(?:,|and|&)\s*\d{1,2})*)[\s-]*(year|yr|month)s?[\s-]*olds?\b/g)]
    .flatMap((m) => m[1]!.match(/\d+/g)!.map((n) => (m[2] === "month" ? Math.floor(Number(n) / 12) : Number(n))))
    .filter((a) => a >= 0 && a <= 17);
  const crisis = detectCrisis(text);
  return {
    categories: categories.slice(0, 6),
    kidsAges: [...new Set(kidsAges)].slice(0, 12),
    budget: /can'?t afford|cannot afford|no money|broke|for free|free\b/.test(t) ? "free_only"
      : /cheap|low.?cost|affordable/.test(t) ? "low" : null,
    urgency: crisis.flagged ? "crisis" : /urgent|asap|today|tonight|right now|emergency/.test(t) ? "high" : "medium",
    language: null,
    scheduleNeeds: [...new Set(SCHEDULE_KEYWORDS.filter(([, re]) => re.test(t)).flatMap(([s]) => s))],
    summary: categories.length ? `Looking for help with: ${categories.join(", ").replace(/_/g, " ")}` : "Looking for support",
    crisisSignals: crisis.signals,
  };
}

/* ------------------------------- entry point ------------------------------- */

export async function extractIntent(
  rawText: string,
  ctx: UserContext,
  generate: GenerateFn = callGemini,
): Promise<IntentResult> {
  const crisis = detectCrisis(rawText); // before any Gemini call
  const prompt = JSON.stringify({ context: toLlmSafeContext(ctx), message: redactPii(rawText).slice(0, 2000) });

  let intent: StructuredIntent | null = null;
  try {
    const parsed = structuredIntentSchema.safeParse(JSON.parse(await generate(prompt, AbortSignal.timeout(TIMEOUT_MS))));
    if (parsed.success) intent = parsed.data;
    // Field paths only — never the text or Gemini's output.
    else console.warn("extract-intent: invalid Gemini output, using fallback:", parsed.error.issues.map((i) => i.path.join(".")));
  } catch (e) {
    // Timeout, network, missing key or bad JSON. Log the error type only.
    console.warn("extract-intent: Gemini failed, using fallback:", e instanceof Error ? e.name : typeof e, (e as { status?: number })?.status ?? "");
  }
  if (!intent) return { intent: keywordIntent(rawText), intentSource: "fallback" };

  // The keyword check is authoritative for crisis: Gemini can add signals, never remove them.
  const crisisSignals = [...new Set([...intent.crisisSignals, ...crisis.signals])];
  return {
    intent: { ...intent, crisisSignals, urgency: crisisSignals.length ? "crisis" : intent.urgency },
    intentSource: "gemini",
  };
}
