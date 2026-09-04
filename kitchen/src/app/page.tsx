import Link from "next/link";
import { CookbookSpineShelf } from "@/components/CookbookSpineShelf";
import { HomeRecipeSearch } from "@/components/HomeRecipeSearch";
import { RecipeIndexBox } from "@/components/RecipeIndexBox";
import { RecipeTabCard } from "@/components/RecipeTabCard";
import { getCurrentUser } from "@/lib/auth";
import { listMyCookbooks } from "@/lib/cookbooks";
import { listRecentRecipes } from "@/lib/recipes";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="grid gap-6 py-8">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">A recipe box that cannot get discontinued.</h1>
        <p className="text-xl text-muted">
          Type recipes, cook from the iPhone or iPad, and share cookbooks with family.
        </p>
        <p>
          <Link
            href="/sign-in"
            className="btn-clay btn-clay-hover inline-flex min-h-12 items-center rounded-xl px-5 py-3 text-lg no-underline"
          >
            Sign in with email
          </Link>
        </p>
      </main>
    );
  }

  const [recipes, cookbooks] = await Promise.all([
    listRecentRecipes(user.id, 5),
    listMyCookbooks(user.id).then((items) => items.slice(0, 3)),
  ]);

  return (
    <main className="grid gap-8">
      <section className="grid gap-2">
        <h1 className="font-serif text-4xl">Welcome, {user.name}</h1>
        <p className="text-muted">Your family recipe box — cook, share, and keep everything in one place.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/recipes/new" className="btn-clay btn-clay-hover inline-flex min-h-12 rounded-xl px-4 py-2 no-underline">
            Add recipe
          </Link>
          <Link
            href="/cookbooks/new"
            className="inline-flex min-h-12 items-center rounded-xl border border-line bg-white px-4 py-2 text-ink no-underline hover:bg-paper"
          >
            New cookbook
          </Link>
        </div>
      </section>

      <HomeRecipeSearch />

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Recent recipes</h2>
          <Link href="/recipes" className="text-clay">
            View all
          </Link>
        </div>
        {recipes.length === 0 ? (
          <p className="text-muted">No recipes yet.</p>
        ) : (
          <RecipeIndexBox>
            {recipes.map((recipe, index) => (
              <RecipeTabCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                category={recipe.category}
                cookMinutes={recipe.cookMinutes}
                difficulty={recipe.difficulty}
                index={index}
              />
            ))}
          </RecipeIndexBox>
        )}
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Cookbooks</h2>
          <Link href="/cookbooks" className="text-clay">
            View all
          </Link>
        </div>
        {cookbooks.length === 0 ? (
          <p className="text-muted">No cookbooks yet.</p>
        ) : (
          <CookbookSpineShelf
            cookbooks={cookbooks.map((cookbook) => ({
              id: cookbook.id,
              title: cookbook.title,
              recipeCount: cookbook._count.recipes,
              visibility: cookbook.visibility,
            }))}
          />
        )}
      </section>
    </main>
  );
}
