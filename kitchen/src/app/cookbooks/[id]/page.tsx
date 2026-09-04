import Link from "next/link";
import { notFound } from "next/navigation";
import { putRecipeInCookbook } from "@/app/actions/cookbooks";
import { RecipeListItem } from "@/components/RecipeListItem";
import { requireUser } from "@/lib/auth";
import { getCookbookForUser, memberRole } from "@/lib/cookbooks";
import { canEditCookbookContents, canManageCookbook } from "@/lib/permissions";
import { listVisibleRecipes } from "@/lib/recipes";

export default async function CookbookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const cookbook = await getCookbookForUser(id, user.id);
  if (!cookbook) {
    notFound();
  }
  const role = await memberRole(cookbook.id, user.id);
  const ownedRecipes = (await listVisibleRecipes(user.id, {})).filter((recipe) => recipe.ownerId === user.id);

  return (
    <main className="grid gap-6">
      <p className="text-muted">
        <Link href="/cookbooks">All cookbooks</Link>
        {canManageCookbook(role) ? (
          <>
            {" · "}
            <Link href={`/cookbooks/${cookbook.id}/settings`}>Sharing</Link>
          </>
        ) : null}
      </p>
      <h1 className="font-serif text-4xl">{cookbook.title}</h1>
      <p className="text-muted">
        {cookbook.visibility} · your role: {role ?? "viewer"}
      </p>
      {cookbook.description ? <p>{cookbook.description}</p> : null}
      {cookbook.recipes.length === 0 ? (
        <p className="text-muted">No recipes in this cookbook yet.</p>
      ) : (
        <ul className="grid gap-3">
          {cookbook.recipes.map((entry) => (
            <RecipeListItem
              key={entry.id}
              id={entry.recipe.id}
              title={entry.recipe.title}
              category={entry.recipe.category}
              cookMinutes={entry.recipe.cookMinutes}
              difficulty={entry.recipe.difficulty}
              tags={entry.recipe.tags}
            />
          ))}
        </ul>
      )}
      {canEditCookbookContents(role) ? (
        <form action={putRecipeInCookbook} className="grid gap-3 rounded-2xl border border-line bg-white p-4">
          <input type="hidden" name="cookbookId" value={cookbook.id} />
          <label className="grid gap-1">
            <span>Add one of your recipes</span>
            <select name="recipeId" className="rounded-xl border border-line bg-white px-3 py-3">
              {ownedRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2">
            Add to this book
          </button>
        </form>
      ) : null}
    </main>
  );
}
