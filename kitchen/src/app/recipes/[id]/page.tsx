import Link from "next/link";
import { notFound } from "next/navigation";
import { copyToMyBook, saveNote } from "@/app/actions/recipes";
import { requireUser } from "@/lib/auth";
import { canEditRecipe } from "@/lib/permissions";
import { getRecipeForUser } from "@/lib/recipes";
import { parseTags } from "@/lib/tags";

function recipeTypeLabel(type: string): string {
  switch (type) {
    case "baking":
      return "Baking";
    case "cooking_and_baking":
      return "Cooking + baking";
    case "cooking":
      return "Cooking";
    default:
      return type;
  }
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const recipe = await getRecipeForUser(id, user.id);
  if (!recipe) {
    notFound();
  }
  const editable = canEditRecipe({ userId: user.id, recipeOwnerId: recipe.ownerId });
  const cookingSteps = recipe.steps.split("\n").filter(Boolean);
  const bakingSteps = recipe.bakingSteps.split("\n").filter(Boolean);

  return (
    <main className="grid gap-6">
      <p className="text-muted no-print">
        <Link href="/recipes">All recipes</Link>
        {" · "}
        <Link href={`/recipes/${recipe.id}/cook`}>Cook mode</Link>
        {editable ? (
          <>
            {" · "}
            <Link href={`/recipes/${recipe.id}/edit`}>Edit</Link>
          </>
        ) : null}
      </p>
      <h1 className="font-serif text-4xl leading-tight">{recipe.title}</h1>
      {recipe.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.photos[0].path} alt={recipe.photos[0].alt} className="max-h-80 w-full rounded-2xl object-cover" />
      ) : null}
      <p className="text-muted">
        {recipeTypeLabel(recipe.recipeType)}
        {recipe.servings ? ` · ${recipe.servings} servings` : null}
        {parseTags(recipe.tags).length ? ` · ${parseTags(recipe.tags).join(" · ")}` : null}
        {recipe.sourceUrl ? (
          <>
            {" · "}
            <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              Original source
            </a>
          </>
        ) : null}
      </p>
      {recipe.sourceAttribution ? <p className="text-sm text-muted">{recipe.sourceAttribution}</p> : null}
      <section>
        <h2 className="mb-2 text-xl font-semibold">Ingredients</h2>
        <ul className="grid gap-1 text-lg">
          {recipe.ingredients.split("\n").filter(Boolean).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      {cookingSteps.length > 0 ? (
        <section>
          <h2 className="mb-2 text-xl font-semibold">Cooking instructions</h2>
          <ol className="grid list-decimal gap-2 pl-5 text-lg leading-relaxed">
            {cookingSteps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>
      ) : null}
      {bakingSteps.length > 0 ? (
        <section>
          <h2 className="mb-2 text-xl font-semibold">Baking instructions</h2>
          <ol className="grid list-decimal gap-2 pl-5 text-lg leading-relaxed">
            {bakingSteps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>
      ) : null}
      <section className="grid gap-3 no-print">
        <h2 className="text-xl font-semibold">Family notes</h2>
        <p className="text-muted">Notes do not change the recipe. Only {recipe.owner.name} can edit the card.</p>
        <ul className="grid gap-2">
          {recipe.notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-line bg-white p-3">
              <p>{note.body}</p>
              <p className="text-sm text-muted">{note.user.name}</p>
            </li>
          ))}
        </ul>
        <form action={saveNote} className="grid gap-2">
          <input type="hidden" name="recipeId" value={recipe.id} />
          <textarea name="body" rows={3} className="rounded-xl border border-line bg-white px-3 py-3" placeholder="Don't skip the rest." />
          <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2">
            Add note
          </button>
        </form>
        {recipe.ownerId !== user.id ? (
          <form action={copyToMyBook}>
            <input type="hidden" name="recipeId" value={recipe.id} />
            <button type="submit" className="text-clay">
              Copy into my book
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
