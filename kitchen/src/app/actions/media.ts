"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addRecipeMedia, removeRecipeMedia, saveMediaCaption } from "@/lib/media";
import { revalidatePublicRecipe } from "@/lib/revalidate-public";

function durationFrom(formData: FormData): number | null {
  const raw = String(formData.get("durationSeconds") ?? "").trim();
  if (!raw) {
    return null;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function uploadScan(formData: FormData) {
  const user = await requireUser({ fresh: true });
  const recipeId = String(formData.get("recipeId") ?? "");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Choose a photo of the card first.");
  }
  await addRecipeMedia({
    user,
    recipeId,
    kind: "scan",
    file,
    caption: String(formData.get("caption") ?? ""),
  });
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}#heritage-media`);
}

export async function uploadVoice(formData: FormData) {
  const user = await requireUser({ fresh: true });
  const recipeId = String(formData.get("recipeId") ?? "");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Record or choose a recording first.");
  }
  await addRecipeMedia({
    user,
    recipeId,
    kind: "voice",
    file,
    caption: String(formData.get("caption") ?? ""),
    durationSeconds: durationFrom(formData),
  });
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}#heritage-media`);
}

export async function removeMedia(formData: FormData) {
  const user = await requireUser();
  const recipeId = await removeRecipeMedia(String(formData.get("mediaId") ?? ""), user.id);
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}#heritage-media`);
}

export async function updateMediaCaption(formData: FormData) {
  const user = await requireUser();
  const recipeId = await saveMediaCaption(String(formData.get("mediaId") ?? ""), user.id, String(formData.get("caption") ?? ""));
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}#heritage-media`);
}
