import { describe, expect, it, vi } from "vitest";
import { buildUserContext } from "../src/lib/personalization/build-user-context";
import { extractIntent, redactPii, type GenerateFn } from "../src/lib/personalization/extract-intent";

const NIGHT_SHIFT = "I work nights and can't afford daycare for my 4-year-old";
const ctx = buildUserContext({ postalCode: "T2R 0A1", kidsAges: [4], needs: ["food"] });
const fail: GenerateFn = async () => {
  throw new Error("boom");
};

describe("redactPii", () => {
  it("strips emails, phones, postal codes, street addresses and names", () => {
    const out = redactPii(
      "My name is Sarah. Email sarah.k@example.com or call (403) 555-0199. I live at 123 Elm St SW, T2R 0A1.",
    );
    expect(out).not.toMatch(/Sarah|example\.com|555|123 Elm|T2R|0A1/);
    expect(out).toContain("[email]");
    expect(out).toContain("[phone]");
    expect(out).toContain("[address]");
    expect(out).toContain("[postal code]");
  });

  it.each([
    ["I'm Dana and I need daycare", "I'm [name] and I need daycare"],
    ["I’m Dana", "I’m [name]"],
    ["Hi, I am Priya Singh", "Hi, I am [name]"],
    ["You can call me Sam", "You can call me [name]"],
    ["This is Omar, a single dad", "This is [name], a single dad"],
    ["i'm tired and this is hard", "i'm tired and this is hard"], // lowercase: untouched
  ])("redacts self-introductions: %j", (input, expected) => {
    expect(redactPii(input)).toBe(expected);
  });

  it("keeps kids' ages and ordinary words", () => {
    expect(redactPii(NIGHT_SHIFT)).toBe(NIGHT_SHIFT);
  });
});

describe("extractIntent: keyword fallback", () => {
  it.each([
    ["Gemini throws", fail],
    ["Gemini returns non-JSON", (async () => "not json") as GenerateFn],
    ["Gemini returns the wrong shape", (async () => JSON.stringify({ categories: ["unicorns"] })) as GenerateFn],
  ])("handles the night-shift parent when %s", async (_, generate) => {
    const { intent, intentSource } = await extractIntent(NIGHT_SHIFT, ctx, generate);
    expect(intentSource).toBe("fallback");
    expect(intent.categories).toContain("childcare");
    expect(intent.kidsAges).toEqual([4]);
    expect(intent.budget).toBe("free_only");
    expect(intent.scheduleNeeds).toEqual(expect.arrayContaining(["evenings", "overnight"]));
    expect(intent.urgency).not.toBe("crisis");
  });

  it("reads several ages and months from text", async () => {
    const { intent } = await extractIntent("Swimming for my 7 and 10 year olds and my 18-month-old", ctx, fail);
    expect(intent.kidsAges).toEqual([7, 10, 1]);
  });

  it("flags crisis in the fallback too", async () => {
    const { intent } = await extractIntent("He hits me and we have nowhere to sleep tonight", ctx, fail);
    expect(intent.urgency).toBe("crisis");
    expect(intent.crisisSignals).toEqual(expect.arrayContaining(["abuse", "no_shelter_tonight"]));
  });
});

describe("extractIntent: Gemini path (mocked)", () => {
  const geminiIntent = {
    categories: ["childcare"],
    kidsAges: [4],
    budget: "free_only",
    urgency: "medium",
    language: null,
    scheduleNeeds: ["evenings", "overnight"],
    summary: "Night-shift childcare for a preschooler",
    crisisSignals: [],
  };

  it("uses a valid Gemini response and sends it no PII or location", async () => {
    const generate = vi.fn<GenerateFn>(async () => JSON.stringify(geminiIntent));
    const { intent, intentSource } = await extractIntent(`${NIGHT_SHIFT}. Reach me at mom@example.com`, ctx, generate);
    expect(intentSource).toBe("gemini");
    expect(intent).toEqual(geminiIntent);

    const prompt = generate.mock.calls[0]![0];
    expect(prompt).not.toMatch(/example\.com|T2R|0A1|lat|lng|51\.0|-114/);
    expect(JSON.parse(prompt).context).toEqual({
      kidsAges: [4], needs: ["food"], budget: null, language: null, hasLocation: true,
    });
  });

  it("never lets Gemini drop a keyword crisis signal", async () => {
    const generate: GenerateFn = async () => JSON.stringify(geminiIntent); // says no crisis
    const { intent } = await extractIntent("I want to end my life, I can't do this", ctx, generate);
    expect(intent.crisisSignals).toContain("self_harm");
    expect(intent.urgency).toBe("crisis");
  });
});
