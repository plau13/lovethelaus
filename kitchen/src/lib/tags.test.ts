import { describe, expect, it } from "vitest";
import { parseTags, serializeTags, splitLines } from "./tags";

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

describe("splitLines", () => {
  it("drops empty lines", () => {
    expect(splitLines("a\n\n b \n")).toEqual(["a", "b"]);
  });
});
