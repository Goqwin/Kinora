const STALE_AFTER_DAYS = 180;

/** Fixed reference for stable server renders (avoids prerender `Date.now()`). */
export const STALE_CHECK_REFERENCE_MS = Date.parse("2026-11-07T18:00:00Z");

/** Compare verified date to a reference instant. */
export function isResourceStale(
  lastVerifiedAt: string,
  referenceMs: number = STALE_CHECK_REFERENCE_MS,
): boolean {
  const verified = new Date(lastVerifiedAt);
  if (Number.isNaN(verified.getTime())) return false;
  const days = (referenceMs - verified.getTime()) / (1000 * 60 * 60 * 24);
  return days > STALE_AFTER_DAYS;
}
