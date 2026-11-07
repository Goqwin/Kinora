/**
 * POST /api/support-plan
 * Body: { text?: string (max 2000), onboarding?: { postalCode, neighbourhood, kidsAges, needs, budget, language } }
 * Returns: { crisis, crisisResources, intent, results, relaxed, plan, usedFallback }
 *
 * The pipeline lives in the repo-root src/lib/personalization (relative import,
 * so web/tsconfig.json needs no change). It runs server-side only: it uses the
 * DB connection, which bypasses Supabase RLS. The request text is never logged.
 */
import { NextResponse } from "next/server";
import {
  buildSupportPlan,
  supportPlanRequestSchema,
} from "../../../../../src/lib/personalization/support-plan";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  const body = supportPlanRequestSchema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request. `text` must be a string of up to 2000 characters." }, { status: 400 });
  }

  // TODO(auth): web/ has no Auth0 setup yet, so every request is anonymous and
  // nothing is saved. Once @auth0/nextjs-auth0 is configured, pass the session's
  // `user.sub` here; buildSupportPlan looks up users.id and saves the plan.
  const auth0Sub: string | null = null;

  try {
    return NextResponse.json(await buildSupportPlan(body.data, auth0Sub));
  } catch (e) {
    console.error("support-plan failed:", e instanceof Error ? e.name : typeof e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
