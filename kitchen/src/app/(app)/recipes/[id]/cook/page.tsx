import Link from "next/link";
import { notFound } from "next/navigation";
import { OfflineCookCache } from "@/components/OfflineCookCache";
import { KitchenView } from "@/components/KitchenView";
import { MadeThisButton } from "@/components/MadeThisButton";
import { QueryFlash } from "@/components/QueryFlash";
import { requireOnboardedUser } from "@/lib/auth";
import { getRecipeForUser } from "@/lib/recipes";
import { isSubscriber } from "@/lib/subscription";

export default async function CookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ made?: string; error?: string }>;
}) {
  const user = await requireOnboardedUser();
  const [{ id }, { made, error }] = await Promise.all([params, searchParams]);
  const recipe = await getRecipeForUser(id, user.id);
  if (!recipe) {
    notFound();
  }
  const offlineEnabled = isSubscriber(user);

  return (
    <main className="grid gap-6">
      <QueryFlash error={error} made={made} />
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
        voice={recipe.media.find((entry) => entry.kind === "voice") ?? null}
      />
      <div className="no-print grid gap-2 border-t border-line pt-6">
        <MadeThisButton recipeId={recipe.id} returnTo="cook" large />
      </div>
    </main>
  );
}
