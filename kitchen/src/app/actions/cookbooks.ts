"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  acceptInvite,
  addRecipeToCookbook,
  createCookbook,
  createInvite,
  updateCookbookSettings,
} from "@/lib/cookbooks";

export async function saveCookbook(formData: FormData) {
  const user = await requireUser();
  const cookbook = await createCookbook(
    user.id,
    String(formData.get("title") ?? ""),
    String(formData.get("description") ?? ""),
  );
  redirect(`/cookbooks/${cookbook.id}`);
}

export async function saveCookbookSettings(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  await updateCookbookSettings({
    userId: user.id,
    cookbookId,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    visibility: String(formData.get("visibility") ?? "private"),
  });
  redirect(`/cookbooks/${cookbookId}/settings`);
}

export async function inviteToCookbook(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  const invite = await createInvite(user.id, cookbookId, String(formData.get("role") ?? "viewer"));
  redirect(`/cookbooks/${cookbookId}/settings?invite=${invite.token}`);
}

export async function joinCookbook(token: string) {
  const user = await requireUser();
  const cookbookId = await acceptInvite(user.id, token);
  redirect(`/cookbooks/${cookbookId}`);
}

export async function joinFromInviteForm(formData: FormData) {
  await joinCookbook(String(formData.get("token") ?? ""));
}

export async function putRecipeInCookbook(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  await addRecipeToCookbook(user.id, cookbookId, String(formData.get("recipeId") ?? ""));
  redirect(`/cookbooks/${cookbookId}`);
}
