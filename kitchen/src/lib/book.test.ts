import { describe, expect, it } from "vitest";
import { OTHER_CHAPTER, bookContributors, bookTitle, groupIntoChapters } from "./book";

const recipes = [
  { id: "1", title: "Pot roast", occasion: "Sunday dinner" },
  { id: "2", title: "Weeknight chili", occasion: null },
  { id: "3", title: "Stuffing", occasion: "Thanksgiving" },
  { id: "4", title: "Gravy", occasion: "Thanksgiving" },
  { id: "5", title: "Toast", occasion: "  " },
];

describe("groupIntoChapters", () => {
  it("buckets by occasion, alphabetically, with Other recipes last", () => {
    const chapters = groupIntoChapters(recipes);
    expect(chapters.map((chapter) => chapter.title)).toEqual(["Sunday dinner", "Thanksgiving", OTHER_CHAPTER]);
  });

  it("keeps the cookbook's own ordering inside a chapter", () => {
    const chapters = groupIntoChapters(recipes);
    const thanksgiving = chapters.find((chapter) => chapter.title === "Thanksgiving");
    expect(thanksgiving?.recipes.map((recipe) => recipe.id)).toEqual(["3", "4"]);
  });

  it("treats a blank occasion as no occasion", () => {
    const chapters = groupIntoChapters(recipes);
    const other = chapters.at(-1);
    expect(other?.title).toBe(OTHER_CHAPTER);
    expect(other?.recipes.map((recipe) => recipe.id)).toEqual(["2", "5"]);
  });

  it("omits the Other chapter when every recipe has an occasion", () => {
    const chapters = groupIntoChapters([{ id: "1", title: "Stuffing", occasion: "Thanksgiving" }]);
    expect(chapters.map((chapter) => chapter.title)).toEqual(["Thanksgiving"]);
  });

  it("returns nothing for an empty cookbook", () => {
    expect(groupIntoChapters([])).toEqual([]);
  });
});

describe("bookTitle", () => {
  it("names the family when one is set", () => {
    expect(bookTitle({ title: "Our recipes", familyName: "Lau" })).toBe("The Lau Family Cookbook");
    expect(bookTitle({ title: "Our recipes", familyName: "  Lau  " })).toBe("The Lau Family Cookbook");
  });

  it("falls back to the cookbook title", () => {
    expect(bookTitle({ title: "Our recipes", familyName: null })).toBe("Our recipes");
    expect(bookTitle({ title: "Our recipes", familyName: "   " })).toBe("Our recipes");
  });

  it("has a last resort for an untitled cookbook", () => {
    expect(bookTitle({ title: "   " })).toBe("Our Cookbook");
  });
});

describe("bookContributors", () => {
  const rose = { id: "p1", name: "Grandma Rose", relationship: "grandmother", birthYear: 1931, passedYear: 2019 };
  const dad = { id: "p2", name: "Dad", relationship: null, birthYear: null, passedYear: null };

  it("counts recipes per person, most first then alphabetical", () => {
    const contributors = bookContributors([
      { originPerson: dad },
      { originPerson: rose },
      { originPerson: rose },
      { originPerson: null },
      {},
    ]);
    expect(contributors).toEqual([
      { id: "p1", name: "Grandma Rose", relationship: "grandmother", birthYear: 1931, passedYear: 2019, recipeCount: 2 },
      { id: "p2", name: "Dad", relationship: null, birthYear: null, passedYear: null, recipeCount: 1 },
    ]);
  });

  it("breaks a tie alphabetically", () => {
    const contributors = bookContributors([{ originPerson: rose }, { originPerson: dad }]);
    expect(contributors.map((person) => person.name)).toEqual(["Dad", "Grandma Rose"]);
  });

  it("skips people without a name", () => {
    expect(bookContributors([{ originPerson: { id: "p3", name: "   " } }])).toEqual([]);
  });
});
