import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../lib/personalization/context-store", async () => {
  const { buildUserContext } = await import("../lib/personalization/build-user-context");
  return {
    resolveUserContext: vi.fn(async ({ auth0Sub, onboarding }: { auth0Sub: string | null; onboarding?: unknown }) => ({
      context: buildUserContext(onboarding),
      userId: auth0Sub ? "user-uuid-1" : null,
    })),
  };
});
vi.mock("../lib/personalization/retrieve", () => ({
  retrieveResources: vi.fn(async () => ({
    results: [{ id: "res-1", name: "Sunny Days Child Care", score: 0.83, distanceKm: 8.5, costLabel: "May be eligible for reduced cost" }],
    relaxed: ["radius", "budget"],
  })),
}));
vi.mock("../lib/personalization/save-plan", () => ({ savePlan: vi.fn(async () => "plan-uuid-1") }));

const { buildSupportPlan } = await import("../lib/personalization/support-plan");
const { savePlan } = await import("../lib/personalization/save-plan");
const { toPlanActionRows } = await vi.importActual<typeof import("../lib/personalization/save-plan")>(
  "../lib/personalization/save-plan",
);

const NIGHT_SHIFT = "I work nights and can't afford daycare for my 4-year-old";
const onboarding = { postalCode: "T2R", kidsAges: [4], budget: "free" };

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", ""); // Gemini "down": every AI call fails fast
  vi.mocked(savePlan).mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("buildSupportPlan", () => {
  it("still returns ranked results when Gemini is unavailable", async () => {
    const r = await buildSupportPlan({ text: NIGHT_SHIFT, onboarding }, null);
    expect(r.results.map((x) => x.name)).toEqual(["Sunny Days Child Care"]);
    expect(r.relaxed).toEqual(["radius", "budget"]);
    expect(r.plan).toBeNull();
    expect(r.usedFallback).toBe(true);
    expect(r.intent.categories).toContain("childcare");
    expect(r.crisis).toBe(false);
    expect(r.crisisResources).toEqual([]);
  });

  it("flags a crisis sentence and puts 911 first, then the matching lines", async () => {
    const r = await buildSupportPlan({ text: "My partner hits me and we have nowhere to sleep tonight", onboarding }, null);
    expect(r.crisis).toBe(true);
    const ids = r.crisisResources.map((c) => c.id);
    expect(ids[0]).toBe("emergency");
    // abuse + no_shelter_tonight → these rank above the general ones
    expect(ids.indexOf("family-violence-line")).toBeLessThan(ids.indexOf("kids-help-phone"));
    expect(ids.indexOf("alberta-211")).toBeLessThan(ids.indexOf("kids-help-phone"));
    expect(r.results.length).toBeGreaterThan(0); // results still come back
  });

  it.each([
    ["empty text", "", []],
    ["two words", "need daycare", ["childcare"]],
  ])("skips Gemini for %s: keyword intent, plan null, not a fallback", async (_, text, cats) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = await buildSupportPlan({ text, onboarding }, null);
    expect(warn).not.toHaveBeenCalled(); // no Gemini attempt (it would fail and warn here)
    warn.mockRestore();
    expect(r.intent.categories).toEqual(cats);
    expect(r.plan).toBeNull();
    expect(r.usedFallback).toBe(false);
    expect(r.results.length).toBeGreaterThan(0);
  });

  it("still flags crisis in short text", async () => {
    const r = await buildSupportPlan({ text: "feeling suicidal", onboarding }, null);
    expect(r.crisis).toBe(true);
    expect(r.crisisResources.map((c) => c.id).slice(0, 3)).toEqual(["emergency", "988-suicide-crisis", "distress-centre-calgary"]);
  });

  it("never calls Gemini when AI is switched off", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = await buildSupportPlan({ text: NIGHT_SHIFT, onboarding }, null, { aiEnabled: false });
    expect(warn).not.toHaveBeenCalled(); // a Gemini attempt would fail and warn here
    warn.mockRestore();
    expect(r.plan).toBeNull();
    expect(r.usedFallback).toBe(false);
    expect(r.intent.categories).toContain("childcare");
  });

  it("skips the plan call when the time budget is used up", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = await buildSupportPlan({ text: NIGHT_SHIFT, onboarding }, null, { timeBudgetMs: 0 });
    // Only the intent call is attempted (and fails); the plan call never starts.
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual(["extract-intent: Gemini failed, using fallback:"]);
    warn.mockRestore();
    expect(r.plan).toBeNull();
    expect(r.usedFallback).toBe(true); // → keyword banner on the page
    expect(r.results.length).toBeGreaterThan(0);
  });

  it("saves nothing for anonymous users", async () => {
    await buildSupportPlan({ text: NIGHT_SHIFT, onboarding }, null);
    expect(savePlan).not.toHaveBeenCalled();
  });

  it("saves only the structured intent for logged-in users, never the raw text", async () => {
    await buildSupportPlan({ text: `${NIGHT_SHIFT}. My name is Dana`, onboarding }, "auth0|abc");
    expect(savePlan).toHaveBeenCalledTimes(1);
    const [userId, intent] = vi.mocked(savePlan).mock.calls[0]!;
    expect(userId).toBe("user-uuid-1");
    expect(JSON.stringify(intent)).not.toMatch(/work nights|can't afford|Dana/);
  });

  it("never logs or returns the raw text", async () => {
    const spies = (["log", "warn", "error", "info"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const secret = "Zebra-7731 I need daycare tonight";
    const r = await buildSupportPlan({ text: secret, onboarding }, "auth0|abc");
    const logged = JSON.stringify(spies.flatMap((s) => s.mock.calls));
    expect(logged).not.toContain("Zebra-7731");
    expect(JSON.stringify(r)).not.toContain("Zebra-7731");
    spies.forEach((s) => s.mockRestore());
  });
});

describe("toPlanActionRows", () => {
  it("turns one step with several resources into several rows", () => {
    const rows = toPlanActionRows("plan-1", {
      steps: [
        { title: "Find care", reason: "Fits nights", firstStep: "Ask about evening spots", priority: 1, resourceIds: ["a", "b"] },
        { title: "Subsidy", reason: "Lowers cost", firstStep: "Book pre-screening", priority: 2, resourceIds: ["c"] },
      ],
    });
    expect(rows).toEqual([
      { planId: "plan-1", resourceId: "a", title: "Find care", reason: "Fits nights", firstStep: "Ask about evening spots", priority: 1 },
      { planId: "plan-1", resourceId: "b", title: "Find care", reason: "Fits nights", firstStep: "Ask about evening spots", priority: 1 },
      { planId: "plan-1", resourceId: "c", title: "Subsidy", reason: "Lowers cost", firstStep: "Book pre-screening", priority: 2 },
    ]);
    expect(toPlanActionRows("plan-1", null)).toEqual([]);
  });
});
