import { NextResponse, type NextRequest } from "next/server";

import { geocodePostalFsa } from "@/lib/mapbox/geocode";

export async function GET(request: NextRequest) {
  const postal = request.nextUrl.searchParams.get("postal") ?? "";
  const point = await geocodePostalFsa(postal);
  if (!point) {
    return NextResponse.json(
      {
        error:
          "Postal code not found. Use a Calgary area code, for example T2Y.",
      },
      { status: 404 },
    );
  }
  return NextResponse.json({ point });
}
