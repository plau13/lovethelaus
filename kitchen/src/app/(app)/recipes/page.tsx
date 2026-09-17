import { Pager } from "@/components/Pager";
import { RecipeFiltersBar } from "@/components/RecipeFiltersBar";
import { RecipeListItem } from "@/components/RecipeListItem";
import { requireOnboardedUser } from "@/lib/auth";
import { listMyCookbooks } from "@/lib/cookbooks";
import { paginate } from "@/lib/pagination";
import { recipesPageUrl, type RecipeFilterParams } from "@/lib/recipe-filters";
import { RECIPES_PER_PAGE, countVisibleRecipes, listVisibleRecipes } from "@/lib/recipes";
import { normalizeTag } from "@/lib/search-terms";
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
    tag?: string;
    favorites?: string;
    page?: string;
  }>;
}) {
  const user = await requireOnboardedUser();
  const {
    q = "",
    cookbook: cookbookId = "",
    category: categoryRaw = "",
    time: timeBucket = "",
    difficulty: difficultyRaw = "",
    tag: tagRaw = "",
    favorites: favoritesRaw = "",
    page: pageRaw,
  } = await searchParams;
  const category = RECIPE_CATEGORIES.find((entry) => entry === categoryRaw) as
    | RecipeCategory
    | undefined;
  const difficulty = RECIPE_DIFFICULTIES.find((entry) => entry === difficultyRaw) as
    | RecipeDifficulty
    | undefined;
  const tag = normalizeTag(tagRaw);
  const favoritesOnly = favoritesRaw === "1";

  const filters = {
    q,
    cookbookId: cookbookId || undefined,
    category,
    timeBucket: timeBucket || undefined,
    difficulty,
    tag: tag || undefined,
    favoritesOnly,
  };

  // Count first so the page number is clamped before the rows are fetched.
  const [cookbooks, total] = await Promise.all([
    listMyCookbooks(user.id),
    countVisibleRecipes(user.id, filters),
  ]);
  const pagination = paginate(pageRaw, RECIPES_PER_PAGE, total);
  const recipes = await listVisibleRecipes(user.id, {
    ...filters,
    limit: pagination.perPage,
    offset: pagination.offset,
  });

  const urlParams: RecipeFilterParams = {
    q,
    category: category ?? "",
    time: timeBucket,
    cookbook: cookbookId,
    difficulty: difficulty ?? "",
    tag,
    favorites: favoritesOnly,
  };

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
        tag={tag}
        favorites={favoritesOnly}
        cookbooks={cookbooks.map((cookbook) => ({ id: cookbook.id, title: cookbook.title }))}
      />

      {recipes.length === 0 ? (
        <p className="text-muted">
          {total === 0 && !q && !tag && !favoritesOnly
            ? "No recipes yet. Add your first one."
            : "No recipes match these filters yet."}
        </p>
      ) : (
        <>
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
                linkTags
              />
            ))}
          </ul>
          <Pager
            pagination={pagination}
            noun="recipe"
            hrefForPage={(page) => recipesPageUrl(urlParams, page)}
          />
        </>
      )}
    </main>
  );
}
