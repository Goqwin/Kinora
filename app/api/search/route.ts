import { NextResponse } from "next/server";
import { z } from "zod";

import { CHILD_AGE_BANDS } from "@/lib/db/schema-constants";
import { runSearch } from "@/lib/search/run-search";

const bodySchema = z.object({
  text: z.string().max(1000).optional(),
  postal: z.string().max(12).optional(),
  radiusKm: z.number().min(1).max(50).optional(),
  categories: z.array(z.string()).max(4).optional(),
  childAgeBands: z.array(z.enum(CHILD_AGE_BANDS)).max(5).optional(),
  childAgeYears: z.number().min(0).max(25).nullable().optional(),
  costPreference: z.enum(["free", "subsidized", "any"]).nullable().optional(),
  language: z.string().max(10).nullable().optional(),
  openToMeetParents: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const payload = await runSearch({
      ...body,
      radiusKm: body.radiusKm ?? 15,
    });
    return NextResponse.json({ ok: true, data: payload });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid search request." },
      { status: 400 },
    );
  }
}
