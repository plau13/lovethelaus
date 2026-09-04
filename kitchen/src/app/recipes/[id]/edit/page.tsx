import { notFound } from "next/navigation";
import { saveRecipeEdits } from "@/app/actions/recipes";
import { startImport } from "@/app/actions/import";
import { RecipeEditor } from "@/components/RecipeEditor";
import { requireUser } from "@/lib/auth";
import { canEditRecipe } from "@/lib/permissions";
import { getRecipeForUser } from "@/lib/recipes";
import type { RecipeCategory, RecipeDifficulty, RecipeType } from "@/lib/types";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
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
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Edit recipe</h1>
      <RecipeEditor
        saveAction={saveRecipeEdits}
        importAction={startImport}
        submitLabel="Save changes"
        defaultServings={user.defaultServings}
        hiddenFields={{ recipeId: recipe.id }}
        defaults={{
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
        }}
      />
    </main>
  );
}
