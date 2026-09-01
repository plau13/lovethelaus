import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("builds a URL-safe slug", () => {
    expect(slugify("Mom's Holiday Pies!")).toBe("mom-s-holiday-pies");
  });
});
