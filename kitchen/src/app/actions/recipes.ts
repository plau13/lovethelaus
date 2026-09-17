"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { toggleRecipeFavorite } from "@/lib/favorites";
import { parseYear } from "@/lib/heritage";
import { getMedia } from "@/lib/media";
import { addMemory, deleteMemory } from "@/lib/memories";
import { addNote, copyRecipeToMyBook, createRecipe, updateRecipe, type HeritageArgs } from "@/lib/recipes";
import { revalidatePublicRecipe } from "@/lib/revalidate-public";
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES, RECIPE_TYPES, type RecipeCategory, type RecipeDifficulty, type RecipeType } from "@/lib/types";

function servingsFrom(formData: FormData): number | null {
  const raw = String(formData.get("servings") ?? "").trim();
  if (!raw) {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function cookMinutesFrom(formData: FormData): number | null {
  const raw = String(formData.get("cookMinutes") ?? "").trim();
  if (!raw) {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function categoryFrom(formData: FormData): RecipeCategory | null {
  const raw = String(formData.get("category") ?? "").trim();
  if (!raw) {
    return null;
  }
  return RECIPE_CATEGORIES.find((category) => category === raw) ?? null;
}

function difficultyFrom(formData: FormData): RecipeDifficulty | null {
  const raw = String(formData.get("difficulty") ?? "").trim();
  if (!raw) {
    return null;
  }
  return RECIPE_DIFFICULTIES.find((entry) => entry === raw) ?? null;
}

function recipeTypeFrom(formData: FormData): RecipeType {
  const raw = String(formData.get("recipeType") ?? "cooking");
  const match = RECIPE_TYPES.find((type) => type === raw);
  if (!match) {
    throw new Error("Pick a recipe type.");
  }
  return match;
}

function optionalString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (raw === null) {
    return null;
  }
  const value = String(raw).trim();
  return value ? value : null;
}

function heritageFrom(formData: FormData): HeritageArgs {
  const yearRaw = String(formData.get("firstMadeYear") ?? "").trim();
  const firstMadeYear = parseYear(yearRaw);
  if (yearRaw && firstMadeYear === null) {
    throw new Error("Enter a four-digit year for when it was first made.");
  }
  return {
    story: String(formData.get("story") ?? ""),
    originPersonId: optionalString(formData, "originPersonId"),
    adaptedFromRecipeId: optionalString(formData, "adaptedFromRecipeId"),
    firstMadeYear,
    occasion: optionalString(formData, "occasion"),
  };
}

export async function saveNewRecipe(formData: FormData) {
  const user = await requireUser();
  const recipe = await createRecipe({
    userId: user.id,
    title: String(formData.get("title") ?? ""),
    ingredients: String(formData.get("ingredients") ?? ""),
    steps: String(formData.get("steps") ?? ""),
    bakingSteps: String(formData.get("bakingSteps") ?? ""),
    recipeType: recipeTypeFrom(formData),
    tags: String(formData.get("tags") ?? ""),
    servings: servingsFrom(formData),
    category: categoryFrom(formData),
    cookMinutes: cookMinutesFrom(formData),
    difficulty: difficultyFrom(formData),
    sourceType: "typed",
    sourceUrl: null,
    sourceAttribution: null,
    photo: formData.get("photo") as File | null,
    ...heritageFrom(formData),
  });
  redirect(`/recipes/${recipe.id}`);
}

export async function saveRecipeEdits(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  await updateRecipe({
    userId: user.id,
    recipeId,
    title: String(formData.get("title") ?? ""),
    ingredients: String(formData.get("ingredients") ?? ""),
    steps: String(formData.get("steps") ?? ""),
    bakingSteps: String(formData.get("bakingSteps") ?? ""),
    recipeType: recipeTypeFrom(formData),
    tags: String(formData.get("tags") ?? ""),
    servings: servingsFrom(formData),
    category: categoryFrom(formData),
    cookMinutes: cookMinutesFrom(formData),
    difficulty: difficultyFrom(formData),
    photo: formData.get("photo") as File | null,
    ...heritageFrom(formData),
  });
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}`);
}

export async function saveNote(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  await addNote(user.id, recipeId, String(formData.get("body") ?? ""));
  redirect(`/recipes/${recipeId}`);
}

export async function copyToMyBook(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const copy = await copyRecipeToMyBook(user.id, recipeId);
  redirect(`/recipes/${copy.id}`);
}

/** "I made this" from the recipe page or cook mode. */
export async function recordMemory(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  await addMemory({
    userId: user.id,
    recipeId,
    madeOn: optionalString(formData, "madeOn"),
    note: String(formData.get("note") ?? ""),
  });
  const returnTo = String(formData.get("returnTo") ?? "");
  redirect(returnTo === "cook" ? `/recipes/${recipeId}/cook?made=1` : `/recipes/${recipeId}?made=1`);
}

export async function removeMemory(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  await deleteMemory(String(formData.get("memoryId") ?? ""), user.id);
  redirect(`/recipes/${recipeId}`);
}

/** Copy a stored card transcript into an empty recipe. updateRecipe snapshots a revision, so it is undoable. */
export async function applyTranscript(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const media = await getMedia(String(formData.get("mediaId") ?? ""));
  if (!media || media.recipeId !== recipeId || !media.transcript.trim()) {
    throw new Error("That card has not been read yet.");
  }
  const recipe = media.recipe;
  if (recipe.ingredients.trim() !== "" || recipe.steps.trim() !== "") {
    throw new Error("This recipe already has ingredients and steps. Edit it directly so nothing is lost.");
  }

  const [ingredients = "", steps = ""] = media.transcript
    .split(/\n\s*\n/)
    .slice(1)
    .map((block) => block.trim());

  await updateRecipe({
    userId: user.id,
    recipeId,
    title: String(formData.get("title") ?? "") || media.transcript.split("\n")[0].trim(),
    ingredients,
    steps,
    bakingSteps: "",
    recipeType: "cooking",
    tags: "",
    servings: null,
  });
  await revalidatePublicRecipe(recipeId);
  redirect(`/recipes/${recipeId}`);
}

export async function toggleFavorite(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  await toggleRecipeFavorite(user.id, recipeId);
}
