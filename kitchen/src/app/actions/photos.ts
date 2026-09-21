"use server";

import { redirect } from "next/navigation";
import { redirectActionError } from "@/lib/action-result";
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
  let userId: string | undefined;
  const recipeId = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
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
  } catch (error) {
    redirectActionError(recipeId ? `/recipes/${recipeId}` : "/recipes", error, "photos.upload_failed", userId);
  }
}

export async function deletePhoto(formData: FormData) {
  let userId: string | undefined;
  const recipeIdHint = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const recipeId = await removeRecipePhoto(String(formData.get("photoId") ?? ""), user.id);
    await revalidatePublicRecipe(recipeId);
    redirect(`/recipes/${recipeId}${ANCHOR}`);
  } catch (error) {
    redirectActionError(recipeIdHint ? `/recipes/${recipeIdHint}` : "/recipes", error, "photos.delete_failed", userId);
  }
}

export async function makeCoverPhoto(formData: FormData) {
  let userId: string | undefined;
  const recipeIdHint = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const recipeId = await setCoverPhoto(String(formData.get("photoId") ?? ""), user.id);
    await revalidatePublicRecipe(recipeId);
    redirect(`/recipes/${recipeId}${ANCHOR}`);
  } catch (error) {
    redirectActionError(recipeIdHint ? `/recipes/${recipeIdHint}` : "/recipes", error, "photos.cover_failed", userId);
  }
}

export async function savePhotoAlt(formData: FormData) {
  let userId: string | undefined;
  const recipeIdHint = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const recipeId = await setPhotoAlt(
      String(formData.get("photoId") ?? ""),
      user.id,
      String(formData.get("alt") ?? ""),
    );
    await revalidatePublicRecipe(recipeId);
    redirect(`/recipes/${recipeId}${ANCHOR}`);
  } catch (error) {
    redirectActionError(recipeIdHint ? `/recipes/${recipeIdHint}` : "/recipes", error, "photos.alt_failed", userId);
  }
}
