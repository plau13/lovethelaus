"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addRecipePhoto,
  removeRecipePhoto,
  setCoverPhoto,
  setPhotoAlt,
} from "@/lib/photos";
import { revalidatePublicRecipe } from "@/lib/revalidate-public";

const ANCHOR = "#photos";

export async function uploadPhoto(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Choose a photo first.");
  }
  await addRecipePhoto({
    userId: user.id,
    recipeId,
    file,
    alt: String(formData.get("alt") ?? ""),
  });
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}${ANCHOR}`);
}

export async function deletePhoto(formData: FormData) {
  const user = await requireUser();
  const recipeId = await removeRecipePhoto(String(formData.get("photoId") ?? ""), user.id);
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}${ANCHOR}`);
}

export async function makeCoverPhoto(formData: FormData) {
  const user = await requireUser();
  const recipeId = await setCoverPhoto(String(formData.get("photoId") ?? ""), user.id);
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}${ANCHOR}`);
}

export async function savePhotoAlt(formData: FormData) {
  const user = await requireUser();
  const recipeId = await setPhotoAlt(
    String(formData.get("photoId") ?? ""),
    user.id,
    String(formData.get("alt") ?? ""),
  );
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}${ANCHOR}`);
}
