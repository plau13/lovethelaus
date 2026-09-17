import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("builds a URL-safe slug", () => {
    expect(slugify("Mom's Holiday Pies!")).toBe("mom-s-holiday-pies");
  });
});

describe("recipeSlugFor", () => {
  it("combines the title slug with the id tail", async () => {
    const { recipeSlugFor } = await import("./slug");
    expect(recipeSlugFor("Grandma Rose's Pie", "clx0abcd1234wxyz")).toBe("grandma-rose-s-pie-wxyz");
    expect(recipeSlugFor("!!!", "clx0abcd1234wxyz")).toBe("recipe-wxyz");
  });
});
