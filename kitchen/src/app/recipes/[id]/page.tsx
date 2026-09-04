import Link from "next/link";
import { notFound } from "next/navigation";
import { copyToMyBook, saveNote } from "@/app/actions/recipes";
import { RecipeDetailClient } from "@/components/RecipeDetailClient";
import { requireOnboardedUser } from "@/lib/auth";
import { exportAccessFromLoadedRecipe } from "@/lib/export-eligibility";
import { canCommentOnRecipe, canEditRecipe, canInviteOnRecipe } from "@/lib/permissions";
import { getRecipeForUser } from "@/lib/recipes";
import { parseTags } from "@/lib/tags";
import { difficultyLabel, formatCookMinutes, categoryLabel } from "@/lib/types";

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
  const user = await requireOnboardedUser();
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
  const canInvite = canInviteOnRecipe({
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
  const exportAccess = exportAccessFromLoadedRecipe(user, recipe);
  const baseServings = recipe.servings ?? 4;
  const cookTimeLabel = recipe.cookMinutes ? formatCookMinutes(recipe.cookMinutes) : null;
  const firstPhoto = recipe.photos[0] ?? null;

  const metaParts = [
    recipeTypeLabel(recipe.recipeType),
    recipe.category ? categoryLabel(recipe.category) : null,
    recipe.difficulty ? difficultyLabel(recipe.difficulty) : null,
    parseTags(recipe.tags).length ? parseTags(recipe.tags).join(" · ") : null,
  ].filter(Boolean);

  return (
    <main className="grid gap-6">
      <RecipeDetailClient
        recipeId={recipe.id}
        title={recipe.title}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        bakingSteps={recipe.bakingSteps}
        baseServings={baseServings}
        favorited={recipe.favorited}
        canExport={exportAccess.allowed}
        canEdit={editable}
        canInvite={canInvite}
        isOwner={isOwner}
        collaborators={recipe.collaborators}
        exportHref={`/api/export?format=json&recipeId=${recipe.id}`}
        main={{
          ownerName: recipe.owner.name,
          coAuthorNames: coAuthors.map((entry) => entry.user.name),
          photo: firstPhoto ? { path: firstPhoto.path, alt: firstPhoto.alt } : null,
          canEdit: editable,
          metaLine: (
            <>
              {metaParts.join(" · ")}
              {recipe.sourceUrl ? (
                <>
                  {metaParts.length > 0 ? " · " : null}
                  <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                    Original source
                  </a>
                </>
              ) : null}
            </>
          ),
          sourceAttribution: recipe.sourceAttribution,
          cookingSteps,
          bakingSteps,
          cookTimeLabel,
        }}
      >
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
      </RecipeDetailClient>
    </main>
  );
}
