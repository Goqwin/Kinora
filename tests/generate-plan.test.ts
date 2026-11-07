import { describe, expect, it, vi } from "vitest";
import { generatePlan, stripContactInfo, type GenerateFn } from "../src/lib/personalization/generate-plan";
import type { RankedResource } from "../src/lib/personalization/retrieve";
import type { StructuredIntent } from "../src/lib/personalization/types";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
const FAKE = "99999999-9999-4999-8999-999999999999";

const resource = (id: string, name: string): RankedResource =>
  ({
    id, name, slug: name, description: `${name} description`, category: "childcare", subcategory: null,
    addressLine: "1 Secret St", city: "Calgary", postalCode: "T2R 0A1", costType: "subsidized", costNotes: null,
    ageMinMonths: 0, ageMaxMonths: 71, eligibilitySummary: null, eligibilityRequirements: null, languages: ["en"],
    phone: "403-555-0100", email: "info@example.org", website: "https://example.org", sourceUrl: "sample://x",
    lastVerifiedAt: "2026-11-07", verifiedBy: null, isActive: true, createdAt: null, updatedAt: null,
    startsAt: null, endsAt: null, schedule: ["evenings"], score: 0.9, distanceKm: 2.1,
    costLabel: "May be eligible for reduced cost",
  }) as RankedResource;

const resources = [resource(ID_A, "Night Owl Daycare"), resource(ID_B, "Subsidy Office")];
const intent: StructuredIntent = {
  categories: ["childcare"], kidsAges: [4], budget: "free_only", urgency: "medium", language: null,
  scheduleNeeds: ["evenings", "overnight"], summary: "Night-shift childcare for a preschooler", crisisSignals: [],
};
const step = (over: Record<string, unknown>) => ({
  title: "Find care", reason: "Fits night shifts", firstStep: "Ask about evening spots", priority: 1, resourceIds: [ID_A], ...over,
});
const reply = (steps: unknown[]): GenerateFn => async () => JSON.stringify({ steps });

describe("generatePlan", () => {
  it("removes a fake resource ID, and drops a step left with none", async () => {
    const plan = await generatePlan(intent, resources, reply([
      step({ priority: 2, resourceIds: [ID_A, FAKE] }),
      step({ title: "Made-up place", priority: 1, resourceIds: [FAKE] }),
      step({ title: "Apply for subsidy", priority: 3, resourceIds: [ID_B] }),
    ]));
    expect(plan!.steps.map((s) => s.title)).toEqual(["Find care", "Apply for subsidy"]);
    expect(plan!.steps[0]!.resourceIds).toEqual([ID_A]);
    expect(JSON.stringify(plan)).not.toContain(FAKE);
    expect(plan!.steps.map((s) => s.priority)).toEqual([1, 2]); // renumbered in order
  });

  it.each([
    ["non-JSON", (async () => "not json {") as GenerateFn],
    ["wrong shape", (async () => JSON.stringify({ plan: "do stuff" })) as GenerateFn],
    ["steps of the wrong type", reply([{ title: 5 }, "step", null])],
    ["only fake IDs", reply([step({ resourceIds: [FAKE] })])],
    ["a Gemini error", (async () => { throw new Error("timeout"); }) as GenerateFn],
  ])("returns null without throwing on %s", async (_, generate) => {
    await expect(generatePlan(intent, resources, generate)).resolves.toBeNull();
  });

  it("returns null without calling Gemini when there are no resources", async () => {
    const generate = vi.fn<GenerateFn>();
    expect(await generatePlan(intent, [], generate)).toBeNull();
    expect(generate).not.toHaveBeenCalled();
  });

  it("strips contact details Gemini adds and softens eligibility claims", async () => {
    const plan = await generatePlan(intent, resources, reply([
      step({ reason: "You are eligible for a subsidy, see www.example.ca/apply", firstStep: "Call 403-555-0199" }),
    ]));
    const s = plan!.steps[0]!;
    expect(s.reason).toBe("You may be eligible for a subsidy, see");
    expect(s.firstStep).toBe("Contact them using the details shown");
  });

  it("asks for the plan in the intent's language, English by default", async () => {
    const generate = vi.fn<GenerateFn>(async () => JSON.stringify({ steps: [step({})] }));
    await generatePlan({ ...intent, language: "es" }, resources, generate);
    await generatePlan({ ...intent, language: null }, resources, generate);
    expect(generate.mock.calls.map(([p]) => JSON.parse(p).need.language)).toEqual(["es", "en"]);
  });

  it("sends Gemini only the intent and allowed resource fields", async () => {
    const generate = vi.fn<GenerateFn>(async () => JSON.stringify({ steps: [step({})] }));
    await generatePlan(intent, resources, generate);
    const prompt = generate.mock.calls[0]![0];
    expect(prompt).not.toMatch(/Secret St|T2R|555|example\.org|sample:\/\/|distanceKm|"score"/);
    expect(Object.keys(JSON.parse(prompt).resources[0]).sort()).toEqual(
      ["ageYears", "category", "cost", "description", "eligibilityNotes", "id", "name", "schedule"],
    );
  });
});

describe("stripContactInfo", () => {
  it.each([
    ["Call them at 403-555-0199 to book a visit", "Call them to book a visit"],
    ["Email intake@agency.ca or call (403) 555 0199", "Contact them using the details shown"],
    ["Apply online at https://alberta.ca/subsidy before Friday", "Apply online before Friday"],
    ["Dial 211 for help", "Dial for help"],
    ["Ask them to call you back about evening spots", "Ask them to call you back about evening spots"],
  ])("%j → %j", (input, expected) => {
    expect(stripContactInfo(input)).toBe(expected);
  });
});
