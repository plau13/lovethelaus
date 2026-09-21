import { saveNewRecipe } from "@/app/actions/recipes";
import { startImport } from "@/app/actions/import";
import { QueryFlash } from "@/components/QueryFlash";
import { RecipeEditor } from "@/components/RecipeEditor";
import { requireOnboardedUser } from "@/lib/auth";
import { listPeople } from "@/lib/people";
import { listRecipeTitleOptions } from "@/lib/recipes";

export default async function NewRecipePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, user] = await Promise.all([searchParams, requireOnboardedUser()]);
  const [people, visible] = await Promise.all([listPeople(user.id), listRecipeTitleOptions(user.id)]);
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Add a recipe</h1>
      <QueryFlash error={error} />
      <RecipeEditor
        saveAction={saveNewRecipe}
        importAction={startImport}
        submitLabel="Save recipe"
        defaultServings={user.defaultServings}
        people={people.map((entry) => ({ id: entry.id, name: entry.name, relationship: entry.relationship }))}
        adaptableRecipes={visible.map((entry) => ({ id: entry.id, title: entry.title }))}
      />
    </main>
  );
}
