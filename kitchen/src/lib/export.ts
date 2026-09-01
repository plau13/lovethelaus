import type { ExportPayload, RecipeExport } from "@/lib/types";
import { parseTags, splitLines } from "@/lib/tags";

export type RecipeForExport = {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  servings: number | null;
  tags: string;
  sourceType: string;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  updatedAt: Date;
  notes: Array<{ body: string }>;
};

export function toRecipeExport(recipe: RecipeForExport): RecipeExport {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: splitLines(recipe.ingredients),
    steps: splitLines(recipe.steps),
    servings: recipe.servings,
    tags: parseTags(recipe.tags),
    sourceType: recipe.sourceType,
    sourceUrl: recipe.sourceUrl,
    sourceAttribution: recipe.sourceAttribution,
    notes: recipe.notes.map((note) => note.body),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}

export function buildExportPayload(recipes: RecipeForExport[], exportedAt = new Date()): ExportPayload {
  return {
    version: 1,
    exportedAt: exportedAt.toISOString(),
    recipes: recipes.map(toRecipeExport),
  };
}

export function toCsv(payload: ExportPayload): string {
  const header = ["title", "tags", "ingredients", "sourceUrl"];
  const rows = payload.recipes.map((recipe) =>
    [
      csvCell(recipe.title),
      csvCell(recipe.tags.join("; ")),
      csvCell(recipe.ingredients.join("; ")),
      csvCell(recipe.sourceUrl ?? ""),
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
