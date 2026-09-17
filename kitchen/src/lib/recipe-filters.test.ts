import { describe, expect, it } from "vitest";
import { buildRecipesQuery, recipesPageUrl } from "./recipe-filters";

describe("buildRecipesQuery", () => {
  it("returns the bare path when nothing is set", () => {
    expect(buildRecipesQuery({})).toBe("/recipes");
    expect(buildRecipesQuery({ q: "   ", category: "", tag: "  " })).toBe("/recipes");
  });

  it("includes each filter that is set", () => {
    expect(buildRecipesQuery({ q: " pie ", difficulty: "easy" })).toBe("/recipes?q=pie&difficulty=easy");
    expect(buildRecipesQuery({ cookbook: "cb1", time: "under-30" })).toBe("/recipes?time=under-30&cookbook=cb1");
  });

  it("lowercases a tag so it matches how tags are stored", () => {
    expect(buildRecipesQuery({ tag: " Weeknight " })).toBe("/recipes?tag=weeknight");
  });

  it("writes favorites as a flag", () => {
    expect(buildRecipesQuery({ favorites: true })).toBe("/recipes?favorites=1");
    expect(buildRecipesQuery({ favorites: false })).toBe("/recipes");
  });

  it("omits page one", () => {
    expect(buildRecipesQuery({ page: 1 })).toBe("/recipes");
    expect(buildRecipesQuery({ page: 3 })).toBe("/recipes?page=3");
  });
});

describe("recipesPageUrl", () => {
  it("keeps every filter while changing the page", () => {
    const params = { q: "pie", tag: "holiday", favorites: true, page: 2 };
    expect(recipesPageUrl(params, 3)).toBe("/recipes?q=pie&tag=holiday&favorites=1&page=3");
  });

  it("drops the page number when going back to the first page", () => {
    expect(recipesPageUrl({ q: "pie", page: 4 }, 1)).toBe("/recipes?q=pie");
  });
});
