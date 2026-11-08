import { describe, expect, it } from "vitest";

import {
  isLikelyValidMapboxPublicToken,
  MIN_MAPBOX_PUBLIC_TOKEN_LENGTH,
} from "@/lib/mapbox/config";

describe("mapbox public token validation", () => {
  it("rejects missing or short tokens", () => {
    expect(isLikelyValidMapboxPublicToken(undefined)).toBe(false);
    expect(isLikelyValidMapboxPublicToken("")).toBe(false);
    expect(
      isLikelyValidMapboxPublicToken(`pk.${"x".repeat(MIN_MAPBOX_PUBLIC_TOKEN_LENGTH - 4)}`),
    ).toBe(false);
  });

  it("accepts pk tokens above minimum length", () => {
    expect(
      isLikelyValidMapboxPublicToken(`pk.${"a".repeat(MIN_MAPBOX_PUBLIC_TOKEN_LENGTH)}`),
    ).toBe(true);
  });
});
