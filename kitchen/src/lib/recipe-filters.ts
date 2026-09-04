import type { RecipeCategory, RecipeDifficulty } from "@/lib/types";

export type RecipeFilterParams = {
  q?: string;
  category?: RecipeCategory | "";
  time?: string;
  cookbook?: string;
  difficulty?: RecipeDifficulty | "";
};

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
  const query = search.toString();
  return query ? `/recipes?${query}` : "/recipes";
}
