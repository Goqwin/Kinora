import { NextResponse } from "next/server";
import { z } from "zod";

import { CHILD_AGE_BANDS } from "@/lib/db/schema-constants";
import { runSearch } from "@/lib/search/run-search";
import { clientRefFrom, consumeBudget } from "@/lib/security/request-guard";

const SEARCH_BUDGET = { limit: 20, windowMs: 60_000 };

const bodySchema = z.object({
  text: z.string().max(1000).optional(),
  postal: z.string().max(12).optional(),
  radiusKm: z.number().min(1).max(50).optional(),
  categories: z.array(z.string().max(40)).max(4).optional(),
  childAgeBands: z.array(z.enum(CHILD_AGE_BANDS)).max(5).optional(),
  childAgeYears: z.number().min(0).max(25).nullable().optional(),
  costPreference: z.enum(["free", "subsidized", "any"]).nullable().optional(),
  language: z.string().max(10).nullable().optional(),
  openToMeetParents: z.boolean().optional(),
});

export async function POST(request: Request) {
  const decision = consumeBudget("search", clientRefFrom(request.headers), SEARCH_BUDGET);
  if (!decision.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many searches. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid search request." }, { status: 400 });
  }

  try {
    const payload = await runSearch({ ...body, radiusKm: body.radiusKm ?? 15 });
    return NextResponse.json({ ok: true, data: payload });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Search is unavailable right now. Please try again." },
      { status: 500 },
    );
  }
}
