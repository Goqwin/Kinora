import { describe, expect, it } from "vitest";

import {
  ageBandDisplayLabel,
  filterAgeBandsForDisplay,
  isHangoutCommunityPost,
  MIN_AGE_BAND_COUNT,
  shouldSeedOpenToMeet,
} from "../lib/community/circle-privacy";

describe("filterAgeBandsForDisplay", () => {
  it("hides buckets below the privacy floor", () => {
    const filtered = filterAgeBandsForDisplay([
      { band: "0-2", count: 2 },
      { band: "3-5", count: 3 },
      { band: "6-9", count: 12 },
      { band: "10-13", count: 1 },
    ]);

    expect(MIN_AGE_BAND_COUNT).toBe(3);
    expect(filtered.map((row) => row.band)).toEqual(["6-9", "3-5"]);
    expect(filtered.every((row) => row.count >= MIN_AGE_BAND_COUNT)).toBe(true);
  });
});

describe("ageBandDisplayLabel", () => {
  it("labels schema and seed band formats", () => {
    expect(ageBandDisplayLabel("ages_0_3")).toBe("0–3");
    expect(ageBandDisplayLabel("6-9")).toBe("6–9");
  });
});

describe("isHangoutCommunityPost", () => {
  it("treats other-category and hangout language as hangouts", () => {
    expect(
      isHangoutCommunityPost({
        category: "other",
        title: "Hello",
        body: "Just checking in",
      }),
    ).toBe(true);
    expect(
      isHangoutCommunityPost({
        category: "childcare",
        title: "Anyone for coffee this weekend?",
        body: "Near Beltline",
      }),
    ).toBe(true);
    expect(
      isHangoutCommunityPost({
        category: "financial",
        title: "Subsidy tip",
        body: "Bring pay stubs",
      }),
    ).toBe(false);
  });
});

describe("shouldSeedOpenToMeet", () => {
  it("is deterministic for a given user id", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    expect(shouldSeedOpenToMeet(id)).toBe(shouldSeedOpenToMeet(id));
  });

  it("opts in roughly a quarter to a third of ids", () => {
    let open = 0;
    for (let i = 0; i < 200; i += 1) {
      const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
      if (shouldSeedOpenToMeet(id)) open += 1;
    }
    expect(open).toBeGreaterThan(30);
    expect(open).toBeLessThan(90);
  });
});

describe("applyCircleFloor", () => {
  const circle = (parentCount: number) => ({
    fsa: "T3G",
    label: "Tuscany / Arbour Lake",
    parentCount,
    openToMeetCount: Math.min(parentCount, 2),
    ageBands: [{ band: "6-9", count: 3 }],
  });

  it("keeps exact counts at 5 parents or more", async () => {
    const { applyCircleFloor, MIN_CIRCLE_PARENTS } = await import("../lib/community/circle-privacy");
    expect(MIN_CIRCLE_PARENTS).toBe(5);
    expect(applyCircleFloor(circle(5))).toMatchObject({
      belowFloor: false,
      parentCount: 5,
      openToMeetCount: 2,
      ageBands: [{ band: "6-9", count: 3 }],
    });
  });

  it.each([0, 1, 4])("hides every number for %i parents", async (n) => {
    const { applyCircleFloor } = await import("../lib/community/circle-privacy");
    const floored = applyCircleFloor(circle(n));
    expect(floored).toMatchObject({ belowFloor: true, parentCount: 0, openToMeetCount: 0, ageBands: [] });
    expect(floored.fsa).toBe("T3G"); // the area itself still shows
  });
});
