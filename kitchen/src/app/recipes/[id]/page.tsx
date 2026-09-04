import Link from "next/link";
import { notFound } from "next/navigation";
import { grantRecipeAccess, revokeRecipeAccess } from "@/app/actions/collaborators";
import { copyToMyBook, saveNote } from "@/app/actions/recipes";
import { RecipeDetailToolbar } from "@/components/RecipeDetailToolbar";
import { requireUser } from "@/lib/auth";
import { canExportRecipe } from "@/lib/export-eligibility";
import { isRecipeFavorited } from "@/lib/favorites";
import { canCommentOnRecipe, canEditRecipe } from "@/lib/permissions";
import { getRecipeForUser } from "@/lib/recipes";
import { parseTags } from "@/lib/tags";
import { collabRoleLabel, difficultyLabel, formatCookMinutes, RECIPE_COLLAB_ROLES, categoryLabel } from "@/lib/types";

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

function parseRevisionSnapshot(snapshot: string): { title?: string } {
  try {
    return JSON.parse(snapshot) as { title?: string };
  } catch {
    return {};
  }
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const recipe = await getRecipeForUser(id, user.id);
  if (!recipe) {
    notFound();
  }
  const editable = canEditRecipe({
    userId: user.id,
    recipeOwnerId: recipe.ownerId,
    collaboratorRole: recipe.collaboratorRole ?? null,
  });
  const canComment = canCommentOnRecipe({
    userId: user.id,
    recipeOwnerId: recipe.ownerId,
    collaboratorRole: recipe.collaboratorRole ?? null,
    canView: true,
  });
  const isOwner = recipe.ownerId === user.id;
  const coAuthors = recipe.collaborators.filter((entry) => entry.role === "co-author");
  const cookingSteps = recipe.steps.split("\n").filter(Boolean);
  const bakingSteps = recipe.bakingSteps.split("\n").filter(Boolean);
  const favorited = await isRecipeFavorited(user.id, recipe.id);
  const exportAccess = await canExportRecipe(user.id, recipe.id);

  return (
    <main className="grid gap-6">
      <RecipeDetailToolbar
        recipeId={recipe.id}
        favorited={favorited}
        canExport={exportAccess.allowed}
        canEdit={editable}
        exportHref={`/api/export?format=json&recipeId=${recipe.id}`}
      />
      <h1 className="font-serif text-4xl leading-tight">{recipe.title}</h1>
      <p className="text-muted">
        By {recipe.owner.name}
        {coAuthors.length > 0 ? (
          <>
            {" · Co-authors: "}
            {coAuthors.map((entry) => entry.user.name).join(", ")}
          </>
        ) : null}
      </p>
      {recipe.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.photos[0].path} alt={recipe.photos[0].alt} className="max-h-80 w-full rounded-2xl object-cover" />
      ) : null}
      <p className="text-muted">
        {recipeTypeLabel(recipe.recipeType)}
        {recipe.category ? ` · ${categoryLabel(recipe.category)}` : null}
        {recipe.cookMinutes ? ` · ${formatCookMinutes(recipe.cookMinutes)}` : null}
        {recipe.difficulty ? ` · ${difficultyLabel(recipe.difficulty)}` : null}
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

      {isOwner ? (
        <section className="grid gap-3 no-print rounded-2xl border border-line bg-white p-5">
          <h2 className="text-xl font-semibold">Share access</h2>
          <p className="text-muted text-sm">
            Invite family to view, comment, edit, or co-author this recipe. Co-authors can edit and appear on the
            recipe.
          </p>
          <ul className="grid gap-2 text-sm">
            {recipe.collaborators.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                <span>
                  {entry.user.name} ({entry.user.email}) — {collabRoleLabel(entry.role)}
                </span>
                <form action={revokeRecipeAccess}>
                  <input type="hidden" name="recipeId" value={recipe.id} />
                  <input type="hidden" name="collaboratorUserId" value={entry.userId} />
                  <button type="submit" className="text-clay">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={grantRecipeAccess} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="recipeId" value={recipe.id} />
            <input
              name="email"
              type="email"
              required
              placeholder="family@example.com"
              className="rounded-xl border border-line bg-white px-3 py-2"
            />
            <select name="role" className="rounded-xl border border-line bg-white px-3 py-2" defaultValue="view">
              {RECIPE_COLLAB_ROLES.map((role) => (
                <option key={role} value={role}>
                  {collabRoleLabel(role)}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-clay px-4 py-2 text-white">
              Invite
            </button>
          </form>
        </section>
      ) : null}

      {recipe.revisions.length > 0 ? (
        <section className="grid gap-2 no-print">
          <h2 className="text-xl font-semibold">Version history</h2>
          <ul className="grid gap-2 text-sm">
            {recipe.revisions.map((revision) => {
              const snap = parseRevisionSnapshot(revision.snapshot);
              return (
                <li key={revision.id} className="rounded-xl border border-line bg-white px-3 py-2">
                  {revision.editor.name} saved &ldquo;{snap.title ?? recipe.title}&rdquo; ·{" "}
                  {revision.createdAt.toLocaleString()}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3 no-print">
        <h2 className="text-xl font-semibold">Family notes</h2>
        <p className="text-muted">
          {canComment
            ? "Notes do not change the recipe unless you have edit access."
            : "You have view-only access on this recipe."}
        </p>
        <ul className="grid gap-2">
          {recipe.notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-line bg-white p-3">
              <p>{note.body}</p>
              <p className="text-sm text-muted">{note.user.name}</p>
            </li>
          ))}
        </ul>
        {canComment ? (
          <form action={saveNote} className="grid gap-2">
            <input type="hidden" name="recipeId" value={recipe.id} />
            <textarea name="body" rows={3} className="rounded-xl border border-line bg-white px-3 py-3" placeholder="Don't skip the rest." />
            <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2">
              Add note
            </button>
          </form>
        ) : null}
        {!isOwner ? (
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
