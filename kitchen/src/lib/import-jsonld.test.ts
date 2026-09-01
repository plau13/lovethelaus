import { describe, expect, it } from "vitest";
import { extractRecipeFromHtml } from "./import-jsonld";

const html = `
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Crispy tofu",
  "author": { "@type": "Person", "name": "Auntie Lin" },
  "recipeIngredient": ["1 block tofu", "2 tbsp soy sauce"],
  "recipeInstructions": [
    { "@type": "HowToStep", "text": "Press the tofu." },
    { "@type": "HowToStep", "text": "Pan-fry until golden." }
  ]
}
</script>
</head></html>
`;

describe("extractRecipeFromHtml", () => {
  it("reads schema.org Recipe JSON-LD", () => {
    const draft = extractRecipeFromHtml(html, "https://example.com/tofu");
    expect(draft?.title).toBe("Crispy tofu");
    expect(draft?.ingredients).toContain("1 block tofu");
    expect(draft?.steps).toContain("Pan-fry until golden.");
    expect(draft?.sourceType).toBe("blog");
    expect(draft?.attribution).toContain("Auntie Lin");
  });

  it("returns null when there is no recipe card", () => {
    expect(extractRecipeFromHtml("<html></html>", "https://example.com")).toBeNull();
  });
});
