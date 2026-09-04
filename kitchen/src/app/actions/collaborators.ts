"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { removeRecipeCollaborator, setRecipeCollaborator } from "@/lib/recipes";
import { RECIPE_COLLAB_ROLES, type RecipeCollabRole } from "@/lib/types";

function parseRole(raw: string): RecipeCollabRole {
  if ((RECIPE_COLLAB_ROLES as readonly string[]).includes(raw)) {
    return raw as RecipeCollabRole;
  }
  throw new Error("Choose view, comment, edit, or co-author access.");
}

export async function grantRecipeAccess(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const email = String(formData.get("email") ?? "");
  const role = parseRole(String(formData.get("role") ?? "view"));

  await setRecipeCollaborator({
    actorId: user.id,
    recipeId,
    email,
    role,
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/loved-ones");
}

export async function revokeRecipeAccess(formData: FormData) {
  const user = await requireUser();
  const recipeId = String(formData.get("recipeId") ?? "");
  const collaboratorUserId = String(formData.get("collaboratorUserId") ?? "");

  await removeRecipeCollaborator({
    ownerId: user.id,
    recipeId,
    userId: collaboratorUserId,
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/loved-ones");
}
