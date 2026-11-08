import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAuth0 } from "@/lib/auth/auth0-client";

export async function proxy(request: NextRequest) {
  const auth0 = getAuth0();
  if (!auth0) {
    return NextResponse.next();
  }
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|brand|images|sitemap.xml|robots.txt).*)",
  ],
};
