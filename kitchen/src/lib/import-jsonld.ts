import type { ImportDraftShape } from "@/lib/types";
import { splitLines } from "@/lib/tags";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function asRecord(value: JsonValue | undefined): { [key: string]: JsonValue } | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return null;
}

function asString(value: JsonValue | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

function asStringList(value: JsonValue | undefined): string[] {
  if (!value) {
    return [];
  }
  if (typeof value === "string") {
    return splitLines(value);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") {
        return [item.trim()].filter(Boolean);
      }
      const record = asRecord(item);
      return asString(record?.text) ? [asString(record?.text) as string] : [];
    });
  }
  return [];
}

function typeIncludesRecipe(type: JsonValue | undefined): boolean {
  if (typeof type === "string") {
    return type.split(/\s+/).includes("Recipe") || type.endsWith("Recipe");
  }
  if (Array.isArray(type)) {
    return type.some((entry) => typeIncludesRecipe(entry));
  }
  return false;
}

function collectNodes(value: JsonValue): { [key: string]: JsonValue }[] {
  const record = asRecord(value);
  if (!record) {
    if (Array.isArray(value)) {
      return value.flatMap(collectNodes);
    }
    return [];
  }
  const graph = record["@graph"];
  if (Array.isArray(graph)) {
    return graph.flatMap(collectNodes);
  }
  return [record];
}

export function extractJsonLdBlocks(html: string): JsonValue[] {
  const blocks: JsonValue[] = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = pattern.exec(html);
  while (match) {
    try {
      blocks.push(JSON.parse(match[1]) as JsonValue);
    } catch {
      // Skip malformed JSON-LD blocks.
    }
    match = pattern.exec(html);
  }
  return blocks;
}

export function recipeFromJsonLd(node: { [key: string]: JsonValue }, sourceUrl: string): ImportDraftShape | null {
  if (!typeIncludesRecipe(node["@type"])) {
    return null;
  }
  const title = asString(node.name);
  if (!title) {
    return null;
  }
  const ingredients = asStringList(node.recipeIngredient);
  const instructions = asStringList(node.recipeInstructions);
  const authorRecord = asRecord(node.author);
  const author = asString(node.author) ?? asString(authorRecord?.name);
  return {
    title,
    ingredients: ingredients.join("\n"),
    steps: instructions.join("\n"),
    attribution: author ? `${author} via ${sourceUrl}` : sourceUrl,
    sourceType: "blog",
    sourceUrl,
  };
}

export function extractRecipeFromHtml(html: string, sourceUrl: string): ImportDraftShape | null {
  for (const block of extractJsonLdBlocks(html)) {
    for (const node of collectNodes(block)) {
      const recipe = recipeFromJsonLd(node, sourceUrl);
      if (recipe) {
        return recipe;
      }
    }
  }
  return null;
}
