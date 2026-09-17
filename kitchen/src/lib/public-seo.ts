import { appUrl, photoUrl, publicRecipeUrl } from "@/lib/paths";
import { splitLines } from "@/lib/tags";
import { categoryLabel, formatCookMinutes } from "@/lib/types";

export type PublicRecipeForSeo = {
  id: string;
  slug: string | null;
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps: string;
  servings: number | null;
  tags: string;
  category: string | null;
  cookMinutes: number | null;
  story?: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { name: string };
  photos: { path: string }[];
};

/** A recipe is indexable when at least one containing cookbook is public. */
export function isIndexable(cookbooks: { visibility: string }[]): boolean {
  return cookbooks.some((cookbook) => cookbook.visibility === "public");
}

/** Anonymous visitors may see the page when some cookbook is public or unlisted. */
export function isPubliclyViewable(cookbooks: { visibility: string }[]): boolean {
  return cookbooks.some((cookbook) => cookbook.visibility === "public" || cookbook.visibility === "unlisted");
}

export function isoDuration(minutes: number | null | undefined): string | undefined {
  if (!minutes || minutes <= 0) {
    return undefined;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `PT${hours > 0 ? `${hours}H` : ""}${rest > 0 ? `${rest}M` : ""}` || undefined;
}

/** Short, plain description for meta tags: the story if present, else the first step. */
export function recipeDescription(recipe: Pick<PublicRecipeForSeo, "story" | "steps" | "title" | "owner">): string {
  const story = recipe.story?.trim();
  const source = story || splitLines(recipe.steps)[0] || `${recipe.title}, a family recipe from ${recipe.owner.name}.`;
  const clean = source.replace(/\s+/g, " ").trim();
  return clean.length > 155 ? `${clean.slice(0, 152).trimEnd()}…` : clean;
}

export function recipeImageUrl(recipe: Pick<PublicRecipeForSeo, "photos">): string | null {
  const first = recipe.photos[0];
  return first ? appUrl(photoUrl(first.path)) : null;
}

/** schema.org/Recipe JSON-LD. */
export function recipeJsonLd(recipe: PublicRecipeForSeo): Record<string, unknown> {
  const image = recipeImageUrl(recipe);
  const steps = [...splitLines(recipe.steps), ...splitLines(recipe.bakingSteps)];
  const keywords = recipe.tags
    .split(/[,#]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const category = categoryLabel(recipe.category);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    url: publicRecipeUrl(recipe),
    ...(image ? { image: [image] } : {}),
    author: { "@type": "Person", name: recipe.owner.name },
    datePublished: recipe.createdAt.toISOString(),
    dateModified: recipe.updatedAt.toISOString(),
    description: recipeDescription(recipe),
    recipeIngredient: splitLines(recipe.ingredients),
    recipeInstructions: steps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })),
    ...(recipe.servings ? { recipeYield: `${recipe.servings} servings` } : {}),
    ...(isoDuration(recipe.cookMinutes) ? { totalTime: isoDuration(recipe.cookMinutes) } : {}),
    ...(category ? { recipeCategory: category } : {}),
    ...(keywords.length ? { keywords: keywords.join(", ") } : {}),
  };
}

export function itemListJsonLd(name: string, urls: string[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: urls.length,
    itemListElement: urls.map((url, index) => ({ "@type": "ListItem", position: index + 1, url })),
  };
}

export type Pagination = { page: number; perPage: number; total: number; totalPages: number; offset: number };

export function paginate(pageRaw: string | number | undefined, perPage: number, total: number): Pagination {
  const parsed = typeof pageRaw === "number" ? pageRaw : Number.parseInt(String(pageRaw ?? "1"), 10);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 1, 1), totalPages);
  return { page, perPage, total, totalPages, offset: (page - 1) * perPage };
}

export const COOK_TIME_LABEL = formatCookMinutes;
