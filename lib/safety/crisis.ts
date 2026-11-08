/** Crisis types the keyword check and Gemini can flag. */
export type CrisisSignal = "danger" | "abuse" | "self_harm" | "no_shelter_tonight";

export type CrisisResource = {
  id: string;
  name: string;
  detail: string;
  contact: string;
  href?: string;
  /** Signals this resource is most relevant to; empty = general. */
  signals: CrisisSignal[];
};

/**
 * The ONE crisis list for the whole app (header panel, plan callout and the
 * personalization pipeline). Static only: never generated or changed by AI.
 * Emergency (911) must stay first.
 *
 * TODO(before demo): verify every number and link below against the official
 * source. They have not been checked by the team yet.
 */
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: "emergency",
    name: "Emergency",
    detail: "If you or a child is in immediate danger",
    contact: "Call 911",
    href: "tel:911",
    signals: ["danger", "abuse", "self_harm"],
  },
  {
    id: "alberta-211",
    name: "211 Alberta",
    detail: "Community and social services",
    contact: "Call or text 211",
    href: "https://www.ab.211.ca/",
    signals: ["no_shelter_tonight"],
  },
  {
    id: "988-suicide-crisis",
    name: "988 Suicide Crisis Helpline",
    detail: "24 hour support for suicide crisis",
    contact: "Call or text 988",
    href: "tel:988",
    signals: ["self_harm"],
  },
  {
    id: "distress-centre-calgary",
    name: "Distress Centre Calgary",
    detail: "24 hour crisis line",
    contact: "403-266-4357",
    href: "tel:4032664357",
    signals: ["self_harm", "danger", "abuse"],
  },
  {
    id: "family-violence-line",
    name: "Alberta Family Violence Info Line",
    detail: "Support related to family violence",
    contact: "310-1818",
    href: "tel:3101818",
    signals: ["abuse", "danger"],
  },
  {
    id: "kids-help-phone",
    name: "Kids Help Phone",
    detail: "Support for young people",
    contact: "1-800-668-6868",
    href: "tel:18006686868",
    signals: [],
  },
];

/** The live keyword check (lib/safety) uses other category names; map them to signals. */
const CATEGORY_TO_SIGNAL: Record<string, CrisisSignal> = {
  domestic_violence: "abuse",
  child_safety: "danger",
  medical_emergency: "danger",
  self_harm: "self_harm",
  no_shelter: "no_shelter_tonight",
};

const SIGNALS: readonly string[] = ["danger", "abuse", "self_harm", "no_shelter_tonight"];

/** Pipeline signals and live-check categories → known signals (unknown names dropped). */
export function toCrisisSignals(names: string[]): CrisisSignal[] {
  const out = names
    .map((n) => (SIGNALS.includes(n) ? (n as CrisisSignal) : CATEGORY_TO_SIGNAL[n]))
    .filter((s): s is CrisisSignal => Boolean(s));
  return [...new Set(out)];
}

/** Emergency first, then resources matching the signals, then the rest (list order kept). */
export function crisisResourcesFor(signals: CrisisSignal[]): CrisisResource[] {
  const rank = (r: CrisisResource) =>
    r.id === "emergency" ? 0 : r.signals.some((s) => signals.includes(s)) ? 1 : 2;
  return [...CRISIS_RESOURCES].sort((a, b) => rank(a) - rank(b));
}

export const CRISIS_INTRO =
  "If you need help right now, these services are available. You are not alone.";
