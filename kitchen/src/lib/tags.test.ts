import { describe, expect, it } from "vitest";
import { parseTags, recipeMatchesQuery, serializeTags, splitLines } from "./tags";

describe("parseTags", () => {
  it("splits, lowercases, and drops duplicates", () => {
    expect(parseTags("Chicken, #weeknight, CHICKEN")).toEqual(["chicken", "weeknight"]);
  });
});

describe("serializeTags", () => {
  it("round-trips a list", () => {
    expect(serializeTags(["Soup", "soup", "dinner"])).toBe("soup, dinner");
  });
});

describe("recipeMatchesQuery", () => {
  const recipe = {
    title: "Soy sauce chicken",
    ingredients: "1 chicken\n1/2 cup soy sauce\nmushrooms",
    steps: "Simmer until glossy.",
    tags: "chicken, weeknight",
  };

  it("matches words across title, ingredients, and tags", () => {
    expect(recipeMatchesQuery(recipe, "chicken mushrooms")).toBe(true);
  });

  it("rejects missing words", () => {
    expect(recipeMatchesQuery(recipe, "beef")).toBe(false);
  });

  it("treats blank query as a match", () => {
    expect(recipeMatchesQuery(recipe, "  ")).toBe(true);
  });
});

describe("splitLines", () => {
  it("drops empty lines", () => {
    expect(splitLines("a\n\n b \n")).toEqual(["a", "b"]);
  });
});
