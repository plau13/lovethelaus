import { describe, expect, it } from "vitest";
import { DEFAULT_RECIPE_BOX_NAME, DEFAULT_SERVINGS, readKitchenPrefs } from "./kitchen-prefs";

/** Minimal stand-in for the one method `readKitchenPrefs` uses. */
function form(fields: Record<string, string>) {
  return { get: (name: string) => (name in fields ? fields[name] : null) };
}

const complete = {
  recipeBoxName: "The Lau Family Cookbook",
  defaultServings: "6",
  preferredUnits: "metric",
  defaultCookbookVisibility: "unlisted",
};

describe("readKitchenPrefs", () => {
  it("reads a fully filled form", () => {
    expect(readKitchenPrefs(form(complete))).toEqual({
      recipeBoxName: "The Lau Family Cookbook",
      defaultServings: 6,
      preferredUnits: "metric",
      defaultCookbookVisibility: "unlisted",
    });
  });

  it("falls back on an empty form rather than storing blanks", () => {
    expect(readKitchenPrefs(form({}))).toEqual({
      recipeBoxName: DEFAULT_RECIPE_BOX_NAME,
      defaultServings: DEFAULT_SERVINGS,
      preferredUnits: "us",
      defaultCookbookVisibility: "private",
    });
  });

  it("treats whitespace as absent, the way an empty input arrives", () => {
    expect(readKitchenPrefs(form({ ...complete, recipeBoxName: "   " })).recipeBoxName).toBe(DEFAULT_RECIPE_BOX_NAME);
  });

  it("trims a name that is set", () => {
    expect(readKitchenPrefs(form({ ...complete, recipeBoxName: "  Nana's box  " })).recipeBoxName).toBe("Nana's box");
  });

  it("rejects a name too long to use as a heading", () => {
    expect(() => readKitchenPrefs(form({ ...complete, recipeBoxName: "x".repeat(61) }))).toThrow(/under 60/);
  });

  it("rejects servings that are not a sane whole number", () => {
    for (const defaultServings of ["0", "100", "-2", "2.5", "lots"]) {
      expect(() => readKitchenPrefs(form({ ...complete, defaultServings }))).toThrow(/whole number/);
    }
  });

  it("accepts the ends of the servings range", () => {
    expect(readKitchenPrefs(form({ ...complete, defaultServings: "1" })).defaultServings).toBe(1);
    expect(readKitchenPrefs(form({ ...complete, defaultServings: "99" })).defaultServings).toBe(99);
  });

  it("rejects units and visibility it does not recognize", () => {
    expect(() => readKitchenPrefs(form({ ...complete, preferredUnits: "imperial" }))).toThrow(/US or metric/);
    expect(() => readKitchenPrefs(form({ ...complete, defaultCookbookVisibility: "secret" }))).toThrow(/visible to/);
  });

  it("accepts every visibility the app defines, so the form and the enum cannot drift", () => {
    for (const defaultCookbookVisibility of ["private", "unlisted", "public"]) {
      expect(readKitchenPrefs(form({ ...complete, defaultCookbookVisibility })).defaultCookbookVisibility).toBe(
        defaultCookbookVisibility
      );
    }
  });
});
