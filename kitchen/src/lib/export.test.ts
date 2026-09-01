import { describe, expect, it } from "vitest";
import { buildExportPayload, toCsv } from "./export";

const recipes = [
  {
    id: "r1",
    title: "Soy sauce chicken",
    ingredients: "1 chicken\n1/2 cup soy sauce",
    steps: "Brown.\nSimmer.",
    servings: 4,
    tags: "chicken, weeknight",
    sourceType: "typed",
    sourceUrl: null,
    sourceAttribution: null,
    updatedAt: new Date("2026-08-31T00:00:00.000Z"),
    notes: [{ body: "Don't skip the rest." }],
  },
];

describe("buildExportPayload", () => {
  it("uses version 1 and splits ingredients and steps", () => {
    const payload = buildExportPayload(recipes, new Date("2026-08-31T12:00:00.000Z"));
    expect(payload.version).toBe(1);
    expect(payload.recipes[0]?.ingredients).toEqual(["1 chicken", "1/2 cup soy sauce"]);
    expect(payload.recipes[0]?.notes).toEqual(["Don't skip the rest."]);
  });
});

describe("toCsv", () => {
  it("quotes commas", () => {
    const payload = buildExportPayload(recipes, new Date("2026-08-31T12:00:00.000Z"));
    const csv = toCsv(payload);
    expect(csv.split("\n")[0]).toBe("title,tags,ingredients,sourceUrl");
    expect(csv).toContain("Soy sauce chicken");
    expect(csv).toContain("chicken; weeknight");
  });
});
