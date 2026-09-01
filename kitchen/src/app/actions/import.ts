"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importFromUrl } from "@/lib/import";
import { createRecipe } from "@/lib/recipes";

export async function startImport(formData: FormData) {
  const user = await requireUser();
  const url = String(formData.get("url") ?? "");
  const draft = await importFromUrl(url);
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
  const user = await requireUser();
  const draftId = String(formData.get("draftId") ?? "");
  const draft = await prisma.importDraft.findFirst({
    where: { id: draftId, userId: user.id },
  });
  if (!draft) {
    throw new Error("Import draft not found.");
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
  await prisma.importDraft.update({
    where: { id: draft.id },
    data: { recipeId: recipe.id },
  });
  redirect(`/recipes/${recipe.id}`);
}
