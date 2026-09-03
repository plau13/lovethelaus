import Link from "next/link";
import { RecipeBox, RecipeCategoryTabs, RecipeTimeFilters } from "@/components/RecipeIndexTabs";
import { requireUser } from "@/lib/auth";
import { listMyCookbooks } from "@/lib/cookbooks";
import { listVisibleRecipes } from "@/lib/recipes";
import { parseTags } from "@/lib/tags";
import { categoryLabel, formatCookMinutes, RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/types";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cookbook?: string; category?: string; time?: string }>;
}) {
  const user = await requireUser();
  const { q = "", cookbook: cookbookId = "", category: categoryRaw = "", time: timeBucket = "" } =
    await searchParams;
  const category = RECIPE_CATEGORIES.find((entry) => entry === categoryRaw) as RecipeCategory | undefined;
  const cookbooks = await listMyCookbooks(user.id);
  const recipes = await listVisibleRecipes(user.id, {
    q,
    cookbookId: cookbookId || undefined,
    category,
    timeBucket: timeBucket || undefined,
  });

  function recipesHref(nextCookbookId?: string) {
    const params = new URLSearchParams();
    if (q) {
      params.set("q", q);
    }
    if (nextCookbookId) {
      params.set("cookbook", nextCookbookId);
    }
    if (category) {
      params.set("category", category);
    }
    if (timeBucket) {
      params.set("time", timeBucket);
    }
    const query = params.toString();
    return query ? `/recipes?${query}` : "/recipes";
  }

  const filterParams = {
    activeCategory: category,
    activeTimeBucket: timeBucket || undefined,
    q,
    cookbookId: cookbookId || undefined,
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

      <form className="no-print grid gap-3">
        <label className="grid gap-1">
          <span className="text-muted">Search (title, ingredients, tags)</span>
          <input
            name="q"
            defaultValue={q}
            className="rounded-xl border border-line bg-white px-3 py-3"
            placeholder="chicken mushrooms"
          />
        </label>
        {cookbookId ? <input type="hidden" name="cookbook" value={cookbookId} /> : null}
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {timeBucket ? <input type="hidden" name="time" value={timeBucket} /> : null}
        <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2">
          Search
        </button>
      </form>

      <RecipeCategoryTabs {...filterParams} />

      <RecipeBox>
        <div className="grid gap-5">
          <RecipeTimeFilters {...filterParams} />

          <div className="flex flex-wrap gap-2">
            <Link
              href={recipesHref()}
              className={`rounded-full px-4 py-2 no-underline ${!cookbookId ? "bg-clay text-white" : "border border-line bg-white text-ink"}`}
            >
              All cookbooks
            </Link>
            {cookbooks.map((cookbook) => (
              <Link
                key={cookbook.id}
                href={recipesHref(cookbook.id)}
                className={`rounded-full px-4 py-2 no-underline ${cookbookId === cookbook.id ? "bg-clay text-white" : "border border-line bg-white text-ink"}`}
              >
                {cookbook.title}
              </Link>
            ))}
          </div>

          {recipes.length === 0 ? (
            <p className="text-muted">No recipes match these filters yet.</p>
          ) : (
            <ul className="grid gap-3">
              {recipes.map((recipe) => {
                const meta = [
                  recipe.category ? categoryLabel(recipe.category) : null,
                  formatCookMinutes(recipe.cookMinutes) || null,
                  parseTags(recipe.tags).join(" · ") || null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li key={recipe.id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                    <Link href={`/recipes/${recipe.id}`} className="font-serif text-2xl text-ink no-underline">
                      {recipe.title}
                    </Link>
                    <p className="mt-1 text-muted">{meta || "Untagged"}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </RecipeBox>
    </main>
  );
}
