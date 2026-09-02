"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { importFromUrl } from "@/lib/import";
import { createRecipe } from "@/lib/recipes";
import {
  canStartSocialImport,
  isSocialSource,
  socialImportIncrement,
  socialImportRemaining,
} from "@/lib/subscription";

export async function startImport(formData: FormData) {
  const prisma = await getPrisma();
  const user = await requireUser();
  const url = String(formData.get("url") ?? "");
  const draft = await importFromUrl(url);

  if (isSocialSource(draft.sourceType) && !canStartSocialImport(user)) {
    const remaining = socialImportRemaining(user);
    throw new Error(
      remaining === 0
        ? "Social import limit reached. Free accounts get 3 lifetime imports; subscribers get about 10 per month."
        : "Social import limit reached.",
    );
  }

  const saved = await prisma.importDraft.create({
    data: {
      userId: user.id,
      sourceUrl: draft.sourceUrl,
      sourceType: draft.sourceType,
      rawPayload: JSON.stringify(draft),
      title: draft.title,
      ingredients: draft.ingredients,
      steps: draft.steps,
      attribution: draft.attribution,
    },
  });
  redirect(`/import/confirm/${saved.id}`);
}

export async function confirmImport(formData: FormData) {
  const prisma = await getPrisma();
  const user = await requireUser();
  const draftId = String(formData.get("draftId") ?? "");
  const draft = await prisma.importDraft.findFirst({
    where: { id: draftId, userId: user.id },
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
    await prisma.user.update({
      where: { id: user.id },
      data: socialImportIncrement(user),
    });
  }

  await prisma.importDraft.update({
    where: { id: draft.id },
    data: { recipeId: recipe.id },
  });
  redirect(`/recipes/${recipe.id}`);
}
