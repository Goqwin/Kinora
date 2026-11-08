import { describe, expect, it } from "vitest";
import { detectCrisis } from "../lib/personalization/crisis";

describe("detectCrisis", () => {
  it.each([
    ["My ex threatened to hurt me and I don't feel safe", "danger"],
    ["There was violence at home last night", "danger"],
    ["He hits me when he's drunk", "abuse"],
    ["I think my partner is abusive", "abuse"],
    ["Sometimes I think about suicide", "self_harm"],
    ["I just want to end it all", "self_harm"],
    ["I’ve been hurting myself", "self_harm"], // curly apostrophe
    ["We have nowhere to sleep tonight", "no_shelter_tonight"],
    ["My kids and I are sleeping in my car", "no_shelter_tonight"],
  ])("flags %j as %s", (text, signal) => {
    const r = detectCrisis(text);
    expect(r.flagged).toBe(true);
    expect(r.signals).toContain(signal);
  });

  it.each([
    "I work nights and can't afford daycare for my 4-year-old",
    "Looking for free swimming lessons on weekends",
    "Need help paying rent next month",
    "My son's school talked about bullying today",
    "",
  ])("does not flag %j", (text) => {
    expect(detectCrisis(text)).toEqual({ flagged: false, signals: [] });
  });
});
