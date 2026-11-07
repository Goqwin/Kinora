import { describe, expect, it } from "vitest";

import { CRISIS_RESOURCES } from "@/lib/crisis";
import { getPlaceholderResources } from "@/lib/placeholder-resources";
import { cn } from "@/lib/utils";

describe("smoke", () => {
  it("loads static crisis resources", () => {
    expect(CRISIS_RESOURCES.length).toBeGreaterThanOrEqual(5);
    expect(CRISIS_RESOURCES[0]?.name).toBeTruthy();
  });

  it("loads placeholder resources from CSV", () => {
    const rows = getPlaceholderResources();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.name.includes("PLACEHOLDER"))).toBe(true);
  });

  it("merges class names", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
