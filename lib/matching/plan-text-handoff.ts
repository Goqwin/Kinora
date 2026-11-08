/**
 * Carries the parent's free text from an intake form to /plan without ever
 * putting it in the URL (so it stays out of browser history, server request
 * logs and analytics). It lives in sessionStorage, which is scoped to this tab
 * and cleared when the tab closes.
 *
 * The text is stored with the filter query string it was submitted with, and
 * /plan only uses it when the current URL's filters match. Opening a bare
 * /plan (e.g. the header link) or a different search never picks up old text.
 *
 * Client-only: call from event handlers and effects, not during render.
 */
const STORAGE_KEY = "kinora-plan-text";
const MAX_LENGTH = 1000;

type Stash = { query: string; text: string };

/** Save (or clear, when empty) the text for the /plan URL with this query string. */
export function stashPlanText(query: string, text: string): void {
  try {
    const trimmed = text.trim().slice(0, MAX_LENGTH);
    if (!trimmed) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const stash: Stash = { query, text: trimmed };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stash));
  } catch {
    // Storage blocked (private mode, settings): the search runs without text.
  }
}

/** The stashed text if it belongs to this query string, else "". */
export function readPlanText(query: string): string {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const stash = JSON.parse(raw) as Partial<Stash>;
    return stash.query === query && typeof stash.text === "string" ? stash.text : "";
  } catch {
    return "";
  }
}
