import { describe, expect, it } from "vitest";

import { loginHref, safeReturnPath } from "@/lib/auth/paths";

describe("safeReturnPath", () => {
  it("keeps same-site paths and their query string", () => {
    expect(safeReturnPath("/saved")).toBe("/saved");
    expect(safeReturnPath("/community/3f2a?tab=replies")).toBe("/community/3f2a?tab=replies");
  });

  it("rejects off-site and malformed targets", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example/path",
      "/\\evil.example",
      "javascript:alert(1)",
      "saved",
      "",
      `/${"a".repeat(600)}`,
    ]) {
      expect(safeReturnPath(bad)).toBe("/account");
    }
  });

  it("rejects non-strings and loops back into the auth routes", () => {
    expect(safeReturnPath(undefined)).toBe("/account");
    expect(safeReturnPath(["/saved"])).toBe("/account");
    expect(safeReturnPath("/auth/logout")).toBe("/account");
  });

  it("uses a custom fallback when given", () => {
    expect(safeReturnPath("https://evil.example", "/plan")).toBe("/plan");
  });
});

describe("loginHref", () => {
  it("builds an encoded login link with a safe return path", () => {
    expect(loginHref("/community/42")).toBe("/auth/login?returnTo=%2Fcommunity%2F42");
    expect(loginHref("https://evil.example")).toBe("/auth/login?returnTo=%2Faccount");
  });
});
