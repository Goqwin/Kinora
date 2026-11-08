import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  planActions,
  resources,
  supportPlans,
  type SupportPlanCriteria,
} from "@/lib/db/schema";
import type { PlanAction } from "@/lib/matching/plan";

import { getResourceBySlugFromDb } from "./resources";

export async function persistSupportPlan(input: {
  userId: string;
  criteria: SupportPlanCriteria;
  actions: PlanAction[];
}): Promise<string> {
  const db = getDb();
  const [plan] = await db
    .insert(supportPlans)
    .values({
      userId: input.userId,
      criteria: input.criteria,
    })
    .returning({ id: supportPlans.id });
  if (!plan) throw new Error("Plan insert failed");

  for (const action of input.actions) {
    const resource = await getResourceBySlugFromDb(action.resourceSlug);
    await db.insert(planActions).values({
      planId: plan.id,
      resourceId: resource?.id ?? null,
      title: action.title,
      reason: action.reason,
      firstStep: action.firstStep,
      priority: action.priority,
      status: "todo",
    });
  }

  return plan.id;
}

export async function listLatestPlanActionsForUser(userId: string): Promise<
  {
    id: string;
    title: string;
    firstStep: string;
    status: string;
    resourceSlug: string | null;
  }[]
> {
  const db = getDb();
  const plans = await db
    .select({ id: supportPlans.id })
    .from(supportPlans)
    .where(eq(supportPlans.userId, userId))
    .orderBy(desc(supportPlans.createdAt))
    .limit(1);

  const planId = plans[0]?.id;
  if (!planId) return [];

  const rows = await db
    .select({
      id: planActions.id,
      title: planActions.title,
      firstStep: planActions.firstStep,
      status: planActions.status,
      resourceSlug: resources.slug,
    })
    .from(planActions)
    .leftJoin(resources, eq(planActions.resourceId, resources.id))
    .where(eq(planActions.planId, planId))
    .orderBy(planActions.priority);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    firstStep: row.firstStep,
    status: row.status,
    resourceSlug: row.resourceSlug,
  }));
}
