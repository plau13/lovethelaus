"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { redirectActionError } from "@/lib/action-result";
import { refreshSessionCache, requireUser } from "@/lib/auth";
import { importFromUrl } from "@/lib/import";
import { createRecipe } from "@/lib/recipes";
import { canStartSocialImport, isSocialSource, socialImportIncrement, socialImportRemaining } from "@/lib/subscription";

export async function startImport(formData: FormData) {
  let userId: string | undefined;
  try {
    const user = await requireUser({ fresh: true });
    userId = user.id;
    const url = String(formData.get("url") ?? "");
    const draft = await importFromUrl(url);

    if (isSocialSource(draft.sourceType) && !canStartSocialImport(user)) {
      const remaining = socialImportRemaining(user);
      throw new Error(
        remaining === 0
          ? "Social import limit reached. Free accounts get 3 lifetime imports; subscribers get about 10 per month."
          : "Social import limit reached."
      );
    }

    const db = getDb();
    const [saved] = await db
      .insert(schema.importDraft)
      .values({
        userId: user.id,
        sourceUrl: draft.sourceUrl,
        sourceType: draft.sourceType,
        rawPayload: JSON.stringify(draft),
        title: draft.title,
        ingredients: draft.ingredients,
        steps: draft.steps,
        attribution: draft.attribution,
      })
      .returning({ id: schema.importDraft.id });
    redirect(`/import/confirm/${saved.id}`);
  } catch (error) {
    redirectActionError("/import", error, "import.start_failed", userId);
  }
}

export async function confirmImport(formData: FormData) {
  let userId: string | undefined;
  try {
    const user = await requireUser({ fresh: true });
    userId = user.id;
    const draftId = String(formData.get("draftId") ?? "");
    const db = getDb();
    const draft = await db.query.importDraft.findFirst({
      where: and(eq(schema.importDraft.id, draftId), eq(schema.importDraft.userId, user.id)),
    });
    if (!draft) {
      throw new Error("Import draft not found.");
    }

    if (isSocialSource(draft.sourceType) && !canStartSocialImport(user)) {
      throw new Error("Social import limit reached.");
    }

    const recipe = await createRecipe({
      userId: user.id,
      title: String(formData.get("title") ?? draft.title),
      ingredients: String(formData.get("ingredients") ?? draft.ingredients),
      steps: String(formData.get("steps") ?? draft.steps),
      bakingSteps: String(formData.get("bakingSteps") ?? ""),
      recipeType: String(formData.get("recipeType") ?? "cooking") as "cooking" | "baking" | "cooking_and_baking",
      tags: String(formData.get("tags") ?? ""),
      servings: null,
      sourceType: draft.sourceType,
      sourceUrl: draft.sourceUrl,
      sourceAttribution: String(formData.get("attribution") ?? draft.attribution),
    });

    if (isSocialSource(draft.sourceType)) {
      await db.update(schema.user).set(socialImportIncrement(user)).where(eq(schema.user.id, user.id));
      await refreshSessionCache();
    }

    await db.update(schema.importDraft).set({ recipeId: recipe.id }).where(eq(schema.importDraft.id, draft.id));
    redirect(`/recipes/${recipe.id}`);
  } catch (error) {
    const draftId = String(formData.get("draftId") ?? "");
    redirectActionError(draftId ? `/import/confirm/${draftId}` : "/import", error, "import.confirm_failed", userId);
  }
}
