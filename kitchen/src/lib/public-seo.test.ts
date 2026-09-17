import { afterEach, describe, expect, it } from "vitest";
import { isIndexable, isPubliclyViewable, isoDuration, itemListJsonLd, paginate, recipeDescription, recipeJsonLd } from "./public-seo";

const original = process.env.APP_URL;
afterEach(() => {
  process.env.APP_URL = original;
});

const recipe = {
  id: "abc123xyz789",
  slug: "grandma-rose-pie-z789",
  title: "Grandma Rose's pie",
  ingredients: "2 cups flour\n1 cup butter\n",
  steps: "Mix the dough.\nChill one hour.",
  bakingSteps: "Bake at 375°F for 40 minutes.",
  servings: 8,
  tags: "holiday, baking",
  category: "breads",
  cookMinutes: 95,
  story: "",
  createdAt: new Date("2026-01-02T00:00:00Z"),
  updatedAt: new Date("2026-02-03T00:00:00Z"),
  owner: { name: "Rose" },
  photos: [{ path: "abc123xyz789/1a2b.jpg" }],
};

describe("visibility helpers", () => {
  it("indexes only when a public cookbook contains the recipe", () => {
    expect(isIndexable([{ visibility: "unlisted" }, { visibility: "public" }])).toBe(true);
    expect(isIndexable([{ visibility: "unlisted" }])).toBe(false);
    expect(isPubliclyViewable([{ visibility: "unlisted" }])).toBe(true);
    expect(isPubliclyViewable([{ visibility: "private" }])).toBe(false);
  });
});

describe("isoDuration", () => {
  it("formats minutes as ISO 8601", () => {
    expect(isoDuration(95)).toBe("PT1H35M");
    expect(isoDuration(120)).toBe("PT2H");
    expect(isoDuration(20)).toBe("PT20M");
    expect(isoDuration(null)).toBeUndefined();
    expect(isoDuration(0)).toBeUndefined();
  });
});

describe("recipeJsonLd", () => {
  it("emits a schema.org Recipe with absolute URLs", () => {
    process.env.APP_URL = "https://lovethelaus.com/kitchen";
    const ld = recipeJsonLd(recipe) as Record<string, unknown>;
    expect(ld["@type"]).toBe("Recipe");
    expect(ld.url).toBe("https://lovethelaus.com/kitchen/r/grandma-rose-pie-z789");
    expect(ld.image).toEqual(["https://lovethelaus.com/kitchen/api/recipe-photos/abc123xyz789/1a2b.jpg"]);
    expect(ld.recipeIngredient).toEqual(["2 cups flour", "1 cup butter"]);
    expect(ld.recipeInstructions).toEqual([
      { "@type": "HowToStep", position: 1, text: "Mix the dough." },
      { "@type": "HowToStep", position: 2, text: "Chill one hour." },
      { "@type": "HowToStep", position: 3, text: "Bake at 375°F for 40 minutes." },
    ]);
    expect(ld.totalTime).toBe("PT1H35M");
    expect(ld.recipeYield).toBe("8 servings");
    expect(ld.recipeCategory).toBe("Breads");
    expect(ld.keywords).toBe("holiday, baking");
    expect(ld.author).toEqual({ "@type": "Person", name: "Rose" });
  });

  it("uses the story for the description when present and truncates long text", () => {
    expect(recipeDescription(recipe)).toBe("Mix the dough.");
    const long = { ...recipe, story: "x".repeat(300) };
    expect(recipeDescription(long).length).toBeLessThanOrEqual(155);
    expect(recipeDescription(long).endsWith("…")).toBe(true);
  });
});

describe("itemListJsonLd / paginate", () => {
  it("numbers list items", () => {
    const ld = itemListJsonLd("Pies", ["https://x/1", "https://x/2"]) as { itemListElement: { position: number }[] };
    expect(ld.itemListElement.map((entry) => entry.position)).toEqual([1, 2]);
  });

  it("clamps page numbers", () => {
    expect(paginate("3", 10, 25)).toMatchObject({ page: 3, totalPages: 3, offset: 20 });
    expect(paginate("99", 10, 25).page).toBe(3);
    expect(paginate("0", 10, 25).page).toBe(1);
    expect(paginate("nope", 10, 0)).toMatchObject({ page: 1, totalPages: 1, offset: 0 });
  });
});
