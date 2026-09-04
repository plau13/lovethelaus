"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { toggleCookbookFavorite } from "@/lib/cookbook-favorites";
import {
  acceptInvite,
  addCookbookMemberByEmail,
  addRecipeToCookbook,
  createCookbook,
  createInvite,
  removeCookbookMember,
  updateCookbookSettings,
} from "@/lib/cookbooks";
import { parseEmailList } from "@/lib/parse-emails";

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000/kitchen";
}

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

export async function toggleFavorite(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  await toggleCookbookFavorite(user.id, cookbookId);
}

export async function grantCookbookAccessBatch(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  const role = String(formData.get("role") ?? "viewer");
  const emails = parseEmailList(String(formData.get("emails") ?? ""));

  if (emails.length === 0) {
    throw new Error("Add at least one email address.");
  }

  // Fair use: batch invites in a loop; no hard cap in UI.
  for (const email of emails) {
    await addCookbookMemberByEmail({
      ownerId: user.id,
      cookbookId,
      email,
      role,
    });
  }

  revalidatePath(`/cookbooks/${cookbookId}`);
}

export async function revokeCookbookAccess(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  const memberUserId = String(formData.get("memberUserId") ?? "");

  await removeCookbookMember({
    ownerId: user.id,
    cookbookId,
    userId: memberUserId,
  });

  revalidatePath(`/cookbooks/${cookbookId}`);
}

export async function createCookbookInviteLink(cookbookId: string, role: string): Promise<string> {
  const user = await requireUser();
  const invite = await createInvite(user.id, cookbookId, role);
  return `${appUrl()}/invite/${invite.token}`;
}
