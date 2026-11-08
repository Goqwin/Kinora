import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { FSA_PATTERN, geocodePostalFsa } from "@/lib/mapbox/geocode";
import { clientRefFrom, consumeBudget } from "@/lib/security/request-guard";

const GEOCODE_BUDGET = { limit: 60, windowMs: 60_000 };

const postalSchema = z
  .string()
  .trim()
  .max(7)
  .transform((value) => value.replace(/\s+/g, "").toUpperCase().slice(0, 3))
  .pipe(z.string().regex(FSA_PATTERN));

export async function GET(request: NextRequest) {
  const decision = consumeBudget("geocode", clientRefFrom(request.headers), GEOCODE_BUDGET);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  const parsed = postalSchema.safeParse(request.nextUrl.searchParams.get("postal") ?? "");
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the first three characters of a Calgary postal code, for example T2Y." },
      { status: 400 },
    );
  }

  const point = await geocodePostalFsa(parsed.data);
  if (!point) {
    return NextResponse.json(
      { error: "Postal code not found. Use a Calgary area code, for example T2Y." },
      { status: 404 },
    );
  }
  return NextResponse.json({ point });
}
