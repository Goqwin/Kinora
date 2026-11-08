import { beforeEach, describe, expect, it } from "vitest";

import { FSA_PATTERN } from "@/lib/mapbox/geocode";
import { clientRefFrom, consumeBudget, resetBudgetsForTests } from "@/lib/security/request-guard";

const budget = { limit: 3, windowMs: 60_000 };

describe("consumeBudget", () => {
  beforeEach(() => resetBudgetsForTests());

  it("allows requests up to the limit, then refuses with a retry delay", () => {
    for (let i = 0; i < 3; i++) expect(consumeBudget("t", "a", budget, 1_000 + i).allowed).toBe(true);
    const refused = consumeBudget("t", "a", budget, 1_010);
    expect(refused).toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it("frees capacity once the window has passed", () => {
    for (let i = 0; i < 3; i++) consumeBudget("t", "a", budget, 0);
    expect(consumeBudget("t", "a", budget, 60_001).allowed).toBe(true);
  });

  it("keeps clients and scopes independent", () => {
    for (let i = 0; i < 3; i++) consumeBudget("t", "a", budget, 0);
    expect(consumeBudget("t", "b", budget, 0).allowed).toBe(true);
    expect(consumeBudget("other", "a", budget, 0).allowed).toBe(true);
  });

  it("fails closed on an invalid budget", () => {
    expect(consumeBudget("t", "a", { limit: 0, windowMs: 1 }).allowed).toBe(false);
    expect(consumeBudget("t", "a", { limit: Number.NaN, windowMs: 1 }).allowed).toBe(false);
  });
});

describe("clientRefFrom", () => {
  it("uses the first forwarded address", () => {
    expect(clientRefFrom(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("rejects values that are not IP addresses", () => {
    expect(clientRefFrom(new Headers({ "x-forwarded-for": "<script>" }))).toBe("unknown");
    expect(clientRefFrom(new Headers())).toBe("unknown");
  });
});

describe("FSA_PATTERN", () => {
  it("accepts real Calgary forward sortation areas", () => {
    for (const fsa of ["T2Y", "T3A", "T1Y"]) expect(FSA_PATTERN.test(fsa)).toBe(true);
  });

  it("rejects malformed or impossible codes", () => {
    for (const fsa of ["", "T2", "2TY", "T2Ya", "D2Y", "T2O", "T2Y'"]) expect(FSA_PATTERN.test(fsa)).toBe(false);
  });
});
