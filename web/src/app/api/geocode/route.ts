import { NextResponse, type NextRequest } from "next/server";
import { geocodeFsa } from "@/lib/mapbox/geocode";

export async function GET(req: NextRequest) {
  const point = await geocodeFsa(req.nextUrl.searchParams.get("postal") ?? "");
  return point
    ? NextResponse.json({ point })
    : NextResponse.json({ error: "Postal code not found. Check the first three characters, e.g. T2E." }, { status: 404 });
}
