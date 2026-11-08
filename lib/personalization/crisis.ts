/**
 * Keyword crisis check on the parent's raw text. Runs BEFORE any Gemini call
 * (extractIntent calls it first), so crisis resources never depend on the AI.
 * Deliberately errs toward flagging: a false positive only puts crisis
 * resources first; ranked results still return. Never logs or stores the text.
 */
import type { StructuredIntent } from "./types";

export type CrisisSignal = StructuredIntent["crisisSignals"][number];

const PATTERNS: [CrisisSignal, RegExp][] = [
  ["danger", /\b(in danger|not safe|unsafe|threaten\w*|violen(ce|t)|weapon|gun|knife|going to (hurt|kill) (me|us|my))\b/],
  ["abuse", /\b(abus(e|ed|er|ive|ing)|assault\w*|(hits|hit|beats|beat|chokes|choked|kicks) (me|us|my)|domestic violence)\b/],
  [
    "self_harm",
    /\b(suicid\w*|kill myself|end (my|it all|my life)|self[- ]?harm|hurt(ing)? myself|cut(ting)? myself|want to die|don'?t want to (live|be here)|no reason to live)\b/,
  ],
  [
    "no_shelter_tonight",
    /\b(no ?where to (stay|sleep|go)|no place to (stay|sleep)|homeless|sleeping (in (my|the|a) car|outside|on the street)|kicked out|evicted today|no shelter)\b/,
  ],
];

export function detectCrisis(text: string): { flagged: boolean; signals: CrisisSignal[] } {
  const t = text.toLowerCase().replace(/[‘’]/g, "'");
  const signals = PATTERNS.filter(([, re]) => re.test(t)).map(([s]) => s);
  return { flagged: signals.length > 0, signals };
}
