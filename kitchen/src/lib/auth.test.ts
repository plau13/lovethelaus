import { describe, expect, it } from "vitest";
import { isPreferredUnits, isVisibility } from "@/lib/kitchen-prefs";

describe("session user coercion helpers", () => {
  it("accepts known unit and visibility values", () => {
    expect(isPreferredUnits("us")).toBe(true);
    expect(isPreferredUnits("metric")).toBe(true);
    expect(isPreferredUnits("imperial")).toBe(false);
    expect(isVisibility("private")).toBe(true);
    expect(isVisibility("secret")).toBe(false);
  });
});
