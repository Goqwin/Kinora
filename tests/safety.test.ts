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

describe("crisis callout ranking", () => {
  it("puts 911 first, then lines matching the signals, mapping live-check categories", async () => {
    const { crisisResourcesFor, toCrisisSignals } = await import("@/lib/safety/crisis");
    const signals = toCrisisSignals(["domestic_violence", "no_shelter", "abuse", "unknown"]);
    expect(signals.sort()).toEqual(["abuse", "no_shelter_tonight"]);
    const top4 = crisisResourcesFor(signals).slice(0, 4).map((r) => r.id);
    expect(top4[0]).toBe("emergency");
    expect(top4).toContain("family-violence-line");
    expect(top4).toContain("alberta-211");
  });
});
