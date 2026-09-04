import { RecipeFiltersBar } from "@/components/RecipeFiltersBar";
import { RecipeListItem } from "@/components/RecipeListItem";
import { requireUser } from "@/lib/auth";
import { listMyCookbooks } from "@/lib/cookbooks";
import { listVisibleRecipes } from "@/lib/recipes";
import {
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  type RecipeCategory,
  type RecipeDifficulty,
} from "@/lib/types";
import Link from "next/link";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    cookbook?: string;
    category?: string;
    time?: string;
    difficulty?: string;
  }>;
}) {
  const user = await requireUser();
  const {
    q = "",
    cookbook: cookbookId = "",
    category: categoryRaw = "",
    time: timeBucket = "",
    difficulty: difficultyRaw = "",
  } = await searchParams;
  const category = RECIPE_CATEGORIES.find((entry) => entry === categoryRaw) as
    | RecipeCategory
    | undefined;
  const difficulty = RECIPE_DIFFICULTIES.find((entry) => entry === difficultyRaw) as
    | RecipeDifficulty
    | undefined;
  const [cookbooks, recipes] = await Promise.all([
    listMyCookbooks(user.id),
    listVisibleRecipes(user.id, {
      q,
      cookbookId: cookbookId || undefined,
      category,
      timeBucket: timeBucket || undefined,
      difficulty,
    }),
  ]);

  return (
    <main className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl">Recipes</h1>
        <Link
          href="/recipes/new"
          className="btn-clay btn-clay-hover inline-flex min-h-12 rounded-xl px-4 py-2 no-underline"
        >
          Add recipe
        </Link>
      </div>

      <RecipeFiltersBar
        q={q}
        category={category ?? ""}
        time={timeBucket}
        cookbook={cookbookId}
        difficulty={difficulty ?? ""}
        cookbooks={cookbooks.map((cookbook) => ({ id: cookbook.id, title: cookbook.title }))}
      />

      {recipes.length === 0 ? (
        <p className="text-muted">No recipes match these filters yet.</p>
      ) : (
        <ul className="grid gap-3">
          {recipes.map((recipe) => (
            <RecipeListItem
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              category={recipe.category}
              cookMinutes={recipe.cookMinutes}
              difficulty={recipe.difficulty}
              tags={recipe.tags}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
