import type { ImportDraftShape, SourceType } from "@/lib/types";
import { splitLines } from "@/lib/tags";

const INGREDIENT_HINT = /(\d|cup|tbsp|tsp|oz|lb|g\b|ml|clove|pinch|bunch|can|stick)/i;

export function detectSourceType(url: string): SourceType {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      return "instagram";
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com") || host === "vm.tiktok.com") {
      return "tiktok";
    }
    return "blog";
  } catch {
    return "other";
  }
}

export function structureCaption(text: string): { ingredients: string; steps: string } {
  const lines = splitLines(text);
  const ingredients: string[] = [];
  const steps: string[] = [];
  for (const line of lines) {
    if (INGREDIENT_HINT.test(line) && line.length < 120) {
      ingredients.push(line.replace(/^[-*•]\s*/, ""));
    } else {
      steps.push(line);
    }
  }
  return {
    ingredients: ingredients.join("\n"),
    steps: steps.join("\n"),
  };
}

export function draftFromSocial(args: {
  url: string;
  title?: string;
  authorName?: string;
  caption?: string;
}): ImportDraftShape {
  const sourceType = detectSourceType(args.url);
  const structured = structureCaption(args.caption ?? "");
  const attribution = [args.authorName, args.url].filter(Boolean).join(" — ");
  return {
    title: args.title?.trim() || "Imported recipe",
    ingredients: structured.ingredients,
    steps: structured.steps || (args.caption ?? "").trim(),
    attribution,
    sourceType: sourceType === "blog" ? "other" : sourceType,
    sourceUrl: args.url,
  };
}

export function oembedEndpoint(url: string): string | null {
  const sourceType = detectSourceType(url);
  switch (sourceType) {
    case "tiktok":
      return `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    case "instagram":
      return `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    case "blog":
    case "typed":
    case "card":
    case "other":
      return null;
    default: {
      const _exhaustive: never = sourceType;
      return _exhaustive;
    }
  }
}
