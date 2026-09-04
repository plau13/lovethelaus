"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addNote, copyRecipeToMyBook, createRecipe, updateRecipe } from "@/lib/recipes";
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
  });
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
