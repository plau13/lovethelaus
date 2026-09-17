import Link from "next/link";
import { notFound } from "next/navigation";
import { OfflineCookCache } from "@/components/OfflineCookCache";
import { KitchenView } from "@/components/KitchenView";
import { MadeThisButton } from "@/components/MadeThisButton";
import { requireOnboardedUser } from "@/lib/auth";
import { getRecipeForUser } from "@/lib/recipes";
import { isSubscriber } from "@/lib/subscription";

export default async function CookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ made?: string }>;
}) {
  const user = await requireOnboardedUser();
  const [{ id }, { made }] = await Promise.all([params, searchParams]);
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
      <div className="no-print grid gap-2 border-t border-line pt-6">
        {made === "1" ? <p className="text-clay">Saved to the family timeline.</p> : null}
        <MadeThisButton recipeId={recipe.id} returnTo="cook" large />
      </div>
    </main>
  );
}
