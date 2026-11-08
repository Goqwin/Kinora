/** Minimum parents in an age-band bucket before we show it (k-anonymity floor). */
export const MIN_AGE_BAND_COUNT = 3;

export type AgeBandCount = {
  band: string;
  count: number;
};

/** Minimum parents in an area before we show any exact count for it. */
export const MIN_CIRCLE_PARENTS = 5;

type CircleCounts = {
  parentCount: number;
  openToMeetCount: number;
  ageBands: AgeBandCount[];
};

/**
 * Areas with fewer than MIN_CIRCLE_PARENTS parents (including zero) get no
 * exact numbers: counts are zeroed and age bands dropped before anything
 * reaches the page, and `belowFloor` tells the UI to say "Fewer than 5 parents".
 */
export function applyCircleFloor<T extends CircleCounts>(
  circle: T,
  minParents: number = MIN_CIRCLE_PARENTS,
): T & { belowFloor: boolean } {
  if (circle.parentCount >= minParents) return { ...circle, belowFloor: false };
  return { ...circle, parentCount: 0, openToMeetCount: 0, ageBands: [], belowFloor: true };
}

/**
 * Drop age-band buckets below the privacy floor and sort by count desc.
 */
export function filterAgeBandsForDisplay(
  bands: AgeBandCount[],
  minCount: number = MIN_AGE_BAND_COUNT,
): AgeBandCount[] {
  return bands
    .filter((row) => row.count >= minCount)
    .sort((a, b) => b.count - a.count || a.band.localeCompare(b.band));
}

/** Human label for schema bands or seed formats like "6-9". */
export function ageBandDisplayLabel(band: string): string {
  const known: Record<string, string> = {
    ages_0_3: "0–3",
    ages_3_8: "3–8",
    ages_8_12: "8–12",
    ages_12_17: "12–17",
    ages_18_plus: "18+",
    "0-2": "0–2",
    "3-5": "3–5",
    "6-9": "6–9",
    "10-13": "10–13",
    "14-17": "14–17",
  };
  return known[band] ?? band.replaceAll("_", "–");
}

const HANGOUT_POST_PATTERN =
  /\b(hang\s*out|hangout|coffee|shopping|meetup|meet[\s-]?up|chill|friends?|lonely|isolation|isolat(?:ed|ion)|other parents|chore\s*share|peer|dad|moms?|walk|buddy|company)\b/i;

export function isHangoutCommunityPost(input: {
  category: string;
  title: string;
  body: string;
}): boolean {
  if (input.category === "other") return true;
  return (
    HANGOUT_POST_PATTERN.test(input.title) ||
    HANGOUT_POST_PATTERN.test(input.body)
  );
}

/** Deterministic ~28% opt-in from a UUID (stable across re-seeds). */
export function shouldSeedOpenToMeet(userId: string): boolean {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % 100 < 28;
}
