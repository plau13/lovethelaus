import type { RecipeCategory, RecipeDifficulty } from "@/lib/types";

export type RecipeFilterParams = {
  q?: string;
  category?: RecipeCategory | "";
  time?: string;
  cookbook?: string;
  difficulty?: RecipeDifficulty | "";
  tag?: string;
  favorites?: boolean;
  page?: number;
};

/**
 * Build the /recipes URL for a set of filters. Page is dropped whenever
 * anything else changes, because page 4 of the old result set is meaningless
 * against the new one.
 */
export function buildRecipesQuery(params: RecipeFilterParams): string {
  const search = new URLSearchParams();
  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.category) {
    search.set("category", params.category);
  }
  if (params.time) {
    search.set("time", params.time);
  }
  if (params.cookbook) {
    search.set("cookbook", params.cookbook);
  }
  if (params.difficulty) {
    search.set("difficulty", params.difficulty);
  }
  if (params.tag?.trim()) {
    search.set("tag", params.tag.trim().toLowerCase());
  }
  if (params.favorites) {
    search.set("favorites", "1");
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  const query = search.toString();
  return query ? `/recipes?${query}` : "/recipes";
}

/** The same URL one page over, keeping every filter. */
export function recipesPageUrl(params: RecipeFilterParams, page: number): string {
  return buildRecipesQuery({ ...params, page });
}
