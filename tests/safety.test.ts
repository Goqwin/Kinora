import { describe, expect, it } from "vitest";

import { detectCrisis } from "@/lib/safety";

const PHRASES = [
  "I want to hurt myself",
  "no food tonight",
  "evicted with nowhere to sleep",
  "child is not safe",
  "abusive partner",
  "suicidal thoughts",
  "medical emergency",
  "can't breathe",
  "homeless tonight",
  "hungry kids tonight",
  "leaving my partner because it's violent",
  "severe bleeding",
  "unsafe at home",
  "nothing to eat tonight",
  "end my life",
];

describe("detectCrisis", () => {
  it("matches at least 15 crisis phrases", () => {
    const matched = PHRASES.filter((p) => detectCrisis(p).matched);
    expect(matched.length).toBeGreaterThanOrEqual(15);
  });

  it("does not match benign childcare search", () => {
    const result = detectCrisis("affordable daycare near Forest Lawn");
    expect(result.matched).toBe(false);
  });
});
