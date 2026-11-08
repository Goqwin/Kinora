const DEFAULT_RETURN_PATH = "/account";
const PROBE_ORIGIN = "https://kinora.invalid";
const MAX_RETURN_PATH_LENGTH = 512;

export const LOGOUT_HREF = "/auth/logout";

/**
 * Accept only same-site paths for post-login redirects, so a crafted link like
 * `?returnTo=https://elsewhere.example` cannot send someone off-site after login.
 */
export function safeReturnPath(value: unknown, fallback: string = DEFAULT_RETURN_PATH): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_RETURN_PATH_LENGTH) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;

  try {
    const url = new URL(value, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN || url.pathname.startsWith("/auth/")) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

/** Login links must be plain <a> tags: Next's <Link> would prefetch the login route. */
export function loginHref(returnTo: string): string {
  return `/auth/login?returnTo=${encodeURIComponent(safeReturnPath(returnTo))}`;
}
