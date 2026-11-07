import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  BUDGET_BANDS,
  CHILD_AGE_BANDS,
  INTEREST_TAGS,
} from "@/lib/db/schema-constants";

const childFirstNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/);

const preferencesSchema = z.object({
  postalFsa: z.string().trim().max(7).optional(),
  childAgeBands: z.array(z.enum(CHILD_AGE_BANDS)).max(5),
  interestTags: z.array(z.enum(INTEREST_TAGS)).max(8),
  childFirstNames: z.array(childFirstNameSchema).max(6),
  openToMeetParents: z.boolean(),
  budgetBand: z.enum(BUDGET_BANDS).nullable(),
  language: z.string().trim().min(2).max(10).default("en"),
});

describe("account preferences schema", () => {
  it("accepts valid Kinora preference payload", () => {
    const parsed = preferencesSchema.safeParse({
      postalFsa: "T2Y",
      childAgeBands: ["ages_0_3", "ages_8_12"],
      interestTags: ["childcare", "parent_connection"],
      childFirstNames: ["Sam"],
      openToMeetParents: true,
      budgetBand: "free",
      language: "en",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects oversized or invalid child first names", () => {
    const bad = preferencesSchema.safeParse({
      childAgeBands: [],
      interestTags: [],
      childFirstNames: ["Sam123"],
      openToMeetParents: false,
      budgetBand: null,
      language: "en",
    });
    expect(bad.success).toBe(false);
  });

  it("rejects legacy infant age band strings", () => {
    const legacy = preferencesSchema.safeParse({
      childAgeBands: ["infant"],
      interestTags: [],
      childFirstNames: [],
      openToMeetParents: false,
      budgetBand: null,
      language: "en",
    });
    expect(legacy.success).toBe(false);
  });
});
