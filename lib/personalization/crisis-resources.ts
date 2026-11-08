/**
 * Crisis resources shown FIRST whenever a crisis is flagged. Static on
 * purpose: they must work with no database and no AI.
 *
 * TODO(before demo): every `phone` is a placeholder. Replace each with a
 * number you have verified yourself (official source), and set `verified: true`.
 * The UI must not render an unverified entry as a tappable phone link.
 */
import type { CrisisSignal } from "./crisis";

export type CrisisResource = {
  id: string;
  name: string;
  description: string;
  phone: string;
  available: string;
  verified: boolean;
  /** Signals this resource is most relevant to; empty = always relevant. */
  signals: CrisisSignal[];
};

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: "emergency",
    name: "Emergency services",
    description: "If you or your children are in immediate danger, call emergency services now.",
    phone: "TODO: verified emergency number",
    available: "24/7",
    verified: false,
    signals: [],
  },
  {
    id: "suicide-crisis-line",
    name: "Suicide crisis helpline",
    description: "Free, confidential support if you are thinking about suicide or hurting yourself.",
    phone: "TODO: verified suicide crisis line number",
    available: "TODO: verify hours",
    verified: false,
    signals: ["self_harm"],
  },
  {
    id: "family-violence-line",
    name: "Family violence info line",
    description: "Confidential help and safety planning if someone at home is hurting or threatening you.",
    phone: "TODO: verified family violence line number",
    available: "TODO: verify hours",
    verified: false,
    signals: ["abuse", "danger"],
  },
  {
    id: "distress-centre",
    name: "Calgary distress line",
    description: "Talk to someone right now about whatever is going on.",
    phone: "TODO: verified Calgary distress line number",
    available: "TODO: verify hours",
    verified: false,
    signals: ["self_harm", "danger", "abuse"],
  },
  {
    id: "emergency-shelter",
    name: "Emergency shelter intake",
    description: "Help finding a safe place for you and your children to stay tonight.",
    phone: "TODO: verified shelter intake number",
    available: "TODO: verify hours",
    verified: false,
    signals: ["no_shelter_tonight", "abuse"],
  },
  {
    id: "community-resource-line",
    name: "Community resource line (211)",
    description: "Connects you to local services, including shelters and crisis support.",
    phone: "TODO: verified number",
    available: "TODO: verify hours",
    verified: false,
    signals: [],
  },
];

/** Emergency first, then resources matching the signals, then the rest. */
export function crisisResourcesFor(signals: CrisisSignal[]): CrisisResource[] {
  const rank = (r: CrisisResource) =>
    r.id === "emergency" ? 0 : r.signals.some((s) => signals.includes(s)) ? 1 : 2;
  return [...CRISIS_RESOURCES].sort((a, b) => rank(a) - rank(b));
}
