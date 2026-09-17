import { describe, expect, it } from "vitest";
import { hasSearchTerms, normalizeTag, searchTerms } from "./search-terms";

describe("searchTerms", () => {
  it("collapses whitespace", () => {
    expect(searchTerms("  chicken   mushrooms ")).toBe("chicken mushrooms");
    expect(searchTerms("chicken\n\tmushrooms")).toBe("chicken mushrooms");
  });

  it("treats blank input as no query", () => {
    expect(searchTerms("")).toBe("");
    expect(searchTerms("   ")).toBe("");
    expect(searchTerms(null)).toBe("");
    expect(searchTerms(undefined)).toBe("");
  });

  it("leaves websearch syntax alone", () => {
    expect(searchTerms('"pot roast" or stew -beef')).toBe('"pot roast" or stew -beef');
  });

  it("caps a pathological query", () => {
    expect(searchTerms("a".repeat(500))).toHaveLength(200);
  });
});

describe("hasSearchTerms", () => {
  it("is true only when there is something to search for", () => {
    expect(hasSearchTerms("pie")).toBe(true);
    expect(hasSearchTerms("   ")).toBe(false);
    expect(hasSearchTerms(undefined)).toBe(false);
  });
});

describe("normalizeTag", () => {
  it("matches how serializeTags stores tags", () => {
    expect(normalizeTag("  Weeknight ")).toBe("weeknight");
    expect(normalizeTag("CHICKEN")).toBe("chicken");
    expect(normalizeTag(null)).toBe("");
  });
});
