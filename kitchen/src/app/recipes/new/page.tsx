import { saveNewRecipe } from "@/app/actions/recipes";
import { startImport } from "@/app/actions/import";
import { RecipeEditor } from "@/components/RecipeEditor";
import { requireUser } from "@/lib/auth";

export default async function NewRecipePage() {
  const user = await requireUser();
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Add a recipe</h1>
      <RecipeEditor
        saveAction={saveNewRecipe}
        importAction={startImport}
        submitLabel="Save recipe"
        defaultServings={user.defaultServings}
      />
    </main>
  );
}
