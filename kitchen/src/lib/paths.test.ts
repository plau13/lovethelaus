import { afterEach, describe, expect, it } from "vitest";
import { appOrigin, appPath, appUrl, photoUrl } from "./paths";

const original = process.env.APP_URL;

afterEach(() => {
  process.env.APP_URL = original;
});

describe("appPath", () => {
  it("prefixes the base path once", () => {
    expect(appPath("/recipes")).toBe("/kitchen/recipes");
    expect(appPath("recipes")).toBe("/kitchen/recipes");
    expect(appPath("/kitchen/recipes")).toBe("/kitchen/recipes");
    expect(appPath("/kitchen")).toBe("/kitchen");
  });

  it("does not treat similar prefixes as the base path", () => {
    expect(appPath("/kitchenette")).toBe("/kitchen/kitchenette");
  });
});

describe("appUrl / appOrigin", () => {
  it("builds absolute URLs from APP_URL", () => {
    process.env.APP_URL = "https://lovethelaus.com/kitchen/";
    expect(appUrl("/invite/abc")).toBe("https://lovethelaus.com/kitchen/invite/abc");
    expect(appOrigin()).toBe("https://lovethelaus.com");
  });

  it("defaults to localhost", () => {
    delete process.env.APP_URL;
    expect(appUrl("/recipes")).toBe("http://localhost:3000/kitchen/recipes");
  });
});

describe("photoUrl", () => {
  it("points at the photo route and encodes segments", () => {
    expect(photoUrl("abc/def.jpg")).toBe("/kitchen/api/recipe-photos/abc/def.jpg");
    expect(photoUrl("a b/c.png")).toBe("/kitchen/api/recipe-photos/a%20b/c.png");
  });
});

describe("public paths", () => {
  it("prefer the slug and fall back to the id", async () => {
    const { publicRecipePath, publicRecipeUrl, publicCookbookPath } = await import("./paths");
    process.env.APP_URL = "https://lovethelaus.com/kitchen";
    expect(publicRecipePath({ id: "abc", slug: "pie-abc" })).toBe("/r/pie-abc");
    expect(publicRecipePath({ id: "abc", slug: null })).toBe("/r/abc");
    expect(publicRecipeUrl({ id: "abc", slug: "pie-abc" })).toBe("https://lovethelaus.com/kitchen/r/pie-abc");
    expect(publicCookbookPath({ slug: "holiday-baking-1a2b" })).toBe("/c/holiday-baking-1a2b");
  });
});
