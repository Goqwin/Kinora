/**
 * Save a generated plan for a LOGGED-IN user (never called for anonymous).
 * One support_plans row with the structured intent in `criteria` (never the
 * raw text), plus one plan_actions row per resource per step. Server-only.
 */
import { db } from "./db";
import { planActions, supportPlans } from "./schema";
import type { SupportPlan } from "./generate-plan";
import type { StructuredIntent } from "./types";

type PlanActionRow = typeof planActions.$inferInsert;
type Conn = Pick<typeof db, "transaction">;

/** A step citing 3 resources becomes 3 rows sharing title/reason/first_step/priority. */
export function toPlanActionRows(planId: string, plan: SupportPlan | null): PlanActionRow[] {
  return (plan?.steps ?? []).flatMap((s) =>
    s.resourceIds.map((resourceId) => ({
      planId,
      resourceId,
      title: s.title,
      reason: s.reason,
      firstStep: s.firstStep,
      priority: s.priority,
    })),
  );
}

export async function savePlan(
  userId: string,
  intent: StructuredIntent,
  plan: SupportPlan | null,
  conn: Conn = db,
): Promise<string> {
  return conn.transaction(async (tx) => {
    const [row] = await tx.insert(supportPlans).values({ userId, criteria: intent }).returning({ id: supportPlans.id });
    const rows = toPlanActionRows(row!.id, plan);
    if (rows.length) await tx.insert(planActions).values(rows);
    return row!.id;
  });
}
