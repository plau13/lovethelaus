import Link from "next/link";
import { notFound } from "next/navigation";
import { OfflineCookCache } from "@/components/OfflineCookCache";
import { KitchenView } from "@/components/KitchenView";
import { requireOnboardedUser } from "@/lib/auth";
import { getRecipeForUser } from "@/lib/recipes";
import { isSubscriber } from "@/lib/subscription";

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const recipe = await getRecipeForUser(id, user.id);
  if (!recipe) {
    notFound();
  }
  const offlineEnabled = isSubscriber(user);

  return (
    <main className="grid gap-6">
      <OfflineCookCache
        enabled={offlineEnabled}
        recipe={{
          id: recipe.id,
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          bakingSteps: recipe.bakingSteps,
        }}
      />
      <p className="no-print text-muted">
        <Link href={`/recipes/${recipe.id}`}>Back</Link>
        {" · "}
        Screen stays awake when the phone allows it.
        {offlineEnabled ? " · Offline cook mode enabled for subscribers." : null}
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
