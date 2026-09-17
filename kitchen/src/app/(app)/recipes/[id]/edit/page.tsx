import { notFound } from "next/navigation";
import { saveRecipeEdits } from "@/app/actions/recipes";
import { startImport } from "@/app/actions/import";
import { RecipeEditor } from "@/components/RecipeEditor";
import { requireOnboardedUser } from "@/lib/auth";
import { photoUrl } from "@/lib/paths";
import { listPeople } from "@/lib/people";
import { listVisibleRecipes } from "@/lib/recipes";
import { canEditRecipe } from "@/lib/permissions";
import { getRecipeForUser } from "@/lib/recipes";
import type { RecipeCategory, RecipeDifficulty, RecipeType } from "@/lib/types";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const recipe = await getRecipeForUser(id, user.id);
  if (
    !recipe ||
    !canEditRecipe({
      userId: user.id,
      recipeOwnerId: recipe.ownerId,
      collaboratorRole: recipe.collaboratorRole ?? null,
    })
  ) {
    notFound();
  }
  const [people, visible] = await Promise.all([listPeople(user.id), listVisibleRecipes(user.id)]);
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Edit recipe</h1>
      <RecipeEditor
        saveAction={saveRecipeEdits}
        importAction={startImport}
        submitLabel="Save changes"
        defaultServings={4}
        hiddenFields={{ recipeId: recipe.id }}
        people={people.map((entry) => ({ id: entry.id, name: entry.name, relationship: entry.relationship }))}
        adaptableRecipes={visible.filter((entry) => entry.id !== recipe.id).map((entry) => ({ id: entry.id, title: entry.title }))}
        defaults={{
          story: recipe.story,
          originPersonId: recipe.originPersonId,
          adaptedFromRecipeId: recipe.adaptedFromRecipeId,
          firstMadeYear: recipe.firstMadeYear,
          occasion: recipe.occasion,
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          bakingSteps: recipe.bakingSteps,
          tags: recipe.tags,
          servings: recipe.servings,
          recipeType: recipe.recipeType as RecipeType,
          category: recipe.category as RecipeCategory | null,
          cookMinutes: recipe.cookMinutes,
          difficulty: recipe.difficulty as RecipeDifficulty | null,
          photoPath: recipe.photos[0] ? photoUrl(recipe.photos[0].path) : undefined,
          photoAlt: recipe.photos[0]?.alt,
        }}
      />
    </main>
  );
}
