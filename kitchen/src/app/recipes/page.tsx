import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listMyCookbooks } from "@/lib/cookbooks";
import { listVisibleRecipes } from "@/lib/recipes";
import { parseTags } from "@/lib/tags";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cookbook?: string }>;
}) {
  const user = await requireUser();
  const { q = "", cookbook: cookbookId = "" } = await searchParams;
  const cookbooks = await listMyCookbooks(user.id);
  const recipes = await listVisibleRecipes(user.id, {
    q,
    cookbookId: cookbookId || undefined,
  });

  function recipesHref(nextCookbookId?: string) {
    const params = new URLSearchParams();
    if (q) {
      params.set("q", q);
    }
    if (nextCookbookId) {
      params.set("cookbook", nextCookbookId);
    }
    const query = params.toString();
    return query ? `/recipes?${query}` : "/recipes";
  }

  return (
    <main className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl">Recipes</h1>
        <Link
          href="/recipes/new"
          className="inline-flex min-h-12 items-center rounded-xl bg-clay px-4 py-2 text-white no-underline hover:bg-clay-dark"
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
        <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={recipesHref()}
          className={`rounded-full px-4 py-2 no-underline ${!cookbookId ? "bg-clay text-white" : "border border-line bg-white text-ink"}`}
        >
          All
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
        <p className="text-muted">No recipes yet. Add one from the button above.</p>
      ) : (
        <ul className="grid gap-3">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="rounded-2xl border border-line bg-white p-4">
              <Link href={`/recipes/${recipe.id}`} className="font-serif text-2xl text-ink no-underline">
                {recipe.title}
              </Link>
              <p className="mt-1 text-muted">{parseTags(recipe.tags).join(" · ") || "Untagged"}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
