import { describe, expect, it } from "vitest";

import { sanitizeUserText } from "@/lib/ai/sanitize";

describe("sanitizeUserText", () => {
  it("redacts emails", () => {
    expect(sanitizeUserText("reach me at anna@example.com")).toContain(
      "[redacted email]",
    );
  });

  it("redacts Canadian phone numbers", () => {
    expect(sanitizeUserText("call 403-555-1234")).toContain("[redacted phone]");
  });

  it("redacts postal codes", () => {
    expect(sanitizeUserText("live near T2Y 1A1")).toContain("[redacted postal]");
    expect(sanitizeUserText("live near T2Y1A1")).toContain("[redacted postal]");
  });

  it("redacts street addresses", () => {
    expect(sanitizeUserText("123 Main Street")).toContain("[redacted address]");
  });

  it("redacts my name is patterns", () => {
    expect(sanitizeUserText("my name is Jordan")).toContain("my name is [redacted]");
  });
});
