import Link from "next/link";
import { notFound } from "next/navigation";
import { KitchenView } from "@/components/KitchenView";
import { requireUser } from "@/lib/auth";
import { getRecipeForUser } from "@/lib/recipes";

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const recipe = await getRecipeForUser(id, user.id);
  if (!recipe) {
    notFound();
  }
  return (
    <main className="grid gap-6">
      <p className="no-print text-muted">
        <Link href={`/recipes/${recipe.id}`}>Back</Link>
        {" · "}
        Screen stays awake when the phone allows it.
      </p>
      <KitchenView
        title={recipe.title}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        bakingSteps={recipe.bakingSteps}
      />
    </main>
  );
}
