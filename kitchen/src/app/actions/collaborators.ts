"use server";

import { revalidatePath } from "next/cache";
import { redirectActionError } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { parseEmailList } from "@/lib/parse-emails";
import { removeRecipeCollaborator, setRecipeCollaborator } from "@/lib/recipes";
import { RECIPE_COLLAB_ROLES, type RecipeCollabRole } from "@/lib/types";

function parseRole(raw: string): RecipeCollabRole {
  if ((RECIPE_COLLAB_ROLES as readonly string[]).includes(raw)) {
    return raw as RecipeCollabRole;
  }
  throw new Error("Choose view, comment, edit, or co-author access.");
}

export async function grantRecipeAccess(formData: FormData) {
  let userId: string | undefined;
  const recipeId = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const email = String(formData.get("email") ?? "");
    const role = parseRole(String(formData.get("role") ?? "view"));

    await setRecipeCollaborator({
      actorId: user.id,
      recipeId,
      email,
      role,
    });

    revalidatePath(`/recipes/${recipeId}`);
  } catch (error) {
    redirectActionError(recipeId ? `/recipes/${recipeId}` : "/recipes", error, "collaborators.grant_failed", userId);
  }
}

export async function grantRecipeAccessBatch(formData: FormData) {
  let userId: string | undefined;
  const recipeId = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const role = parseRole(String(formData.get("role") ?? "view"));
    const emails = parseEmailList(String(formData.get("emails") ?? ""));

    if (emails.length === 0) {
      throw new Error("Add at least one email address.");
    }

    for (const email of emails) {
      await setRecipeCollaborator({
        actorId: user.id,
        recipeId,
        email,
        role,
      });
    }

    revalidatePath(`/recipes/${recipeId}`);
  } catch (error) {
    redirectActionError(recipeId ? `/recipes/${recipeId}` : "/recipes", error, "collaborators.grant_batch_failed", userId);
  }
}

export async function revokeRecipeAccess(formData: FormData) {
  let userId: string | undefined;
  const recipeId = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const collaboratorUserId = String(formData.get("collaboratorUserId") ?? "");

    await removeRecipeCollaborator({
      ownerId: user.id,
      recipeId,
      userId: collaboratorUserId,
    });

    revalidatePath(`/recipes/${recipeId}`);
  } catch (error) {
    redirectActionError(recipeId ? `/recipes/${recipeId}` : "/recipes", error, "collaborators.revoke_failed", userId);
  }
}
