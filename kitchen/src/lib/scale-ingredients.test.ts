import { describe, expect, it } from "vitest";
import { scaleIngredientLine, scaleIngredientLines } from "./scale-ingredients";

describe("scaleIngredientLine", () => {
  it("scales whole numbers", () => {
    expect(scaleIngredientLine("3 tbsp olive oil", 2)).toBe("6 tbsp olive oil");
  });

  it("scales simple fractions", () => {
    expect(scaleIngredientLine("1/2 cup flour", 2)).toBe("1 cup flour");
  });

  it("scales mixed numbers", () => {
    expect(scaleIngredientLine("1 1/2 tsp salt", 2)).toBe("3 tsp salt");
  });

  it("leaves lines without quantities unchanged", () => {
    expect(scaleIngredientLine("salt", 2)).toBe("salt");
    expect(scaleIngredientLine("black pepper", 2)).toBe("black pepper");
  });

  it("returns line unchanged when factor is 1", () => {
    expect(scaleIngredientLine("3 tbsp olive oil", 1)).toBe("3 tbsp olive oil");
  });

  it("scales decimal quantities", () => {
    expect(scaleIngredientLine("1.5 cups milk", 2)).toBe("3 cups milk");
  });
});

describe("scaleIngredientLines", () => {
  it("scales multiple lines", () => {
    const lines = ["3 tbsp olive oil", "1/2 cup flour", "salt"];
    expect(scaleIngredientLines(lines, 2)).toEqual(["6 tbsp olive oil", "1 cup flour", "salt"]);
  });
});
