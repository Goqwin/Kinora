/**
 * Per-client request budget for public, anonymous API routes.
 *
 * In memory and per server instance, so it limits bursts from one client rather
 * than enforcing a global quota. Signed-in actions use the database-backed
 * limits in lib/rate-limit.ts instead.
 */

export type RequestBudget = { limit: number; windowMs: number };
export type BudgetDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

const MAX_TRACKED_CLIENTS = 5_000;
const ledgers = new Map<string, Map<string, number[]>>();

export function consumeBudget(
  scope: string,
  clientRef: string,
  budget: RequestBudget,
  now: number = Date.now(),
): BudgetDecision {
  if (!Number.isFinite(budget.limit) || budget.limit < 1 || budget.windowMs <= 0) {
    return { allowed: false, retryAfterSeconds: 60 };
  }

  let ledger = ledgers.get(scope);
  if (!ledger) {
    ledger = new Map();
    ledgers.set(scope, ledger);
  }

  const windowStart = now - budget.windowMs;
  const recent = (ledger.get(clientRef) ?? []).filter((t) => t > windowStart);

  if (recent.length >= budget.limit) {
    ledger.set(clientRef, recent);
    const retryAfterMs = recent[0] + budget.windowMs - now;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  recent.push(now);
  ledger.delete(clientRef);
  ledger.set(clientRef, recent);
  if (ledger.size > MAX_TRACKED_CLIENTS) {
    const oldest = ledger.keys().next().value;
    if (oldest !== undefined) ledger.delete(oldest);
  }
  return { allowed: true };
}

/** Best-effort client reference. Never logged or stored beyond the budget window. */
export function clientRefFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || headers.get("x-real-ip")?.trim() || "";
  return /^[0-9a-fA-F:.]{2,45}$/.test(candidate) ? candidate : "unknown";
}

export function resetBudgetsForTests(): void {
  ledgers.clear();
}
