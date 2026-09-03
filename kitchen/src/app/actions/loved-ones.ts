"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addCookbookMemberByEmail, createInvite, removeCookbookMember } from "@/lib/cookbooks";

export async function grantCookbookAccess(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "viewer");

  await addCookbookMemberByEmail({
    ownerId: user.id,
    cookbookId,
    email,
    role,
  });

  revalidatePath("/loved-ones");
  revalidatePath(`/cookbooks/${cookbookId}/settings`);
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

  revalidatePath("/loved-ones");
  revalidatePath(`/cookbooks/${cookbookId}/settings`);
}

export async function createCookbookInviteFromHub(formData: FormData) {
  const user = await requireUser();
  const cookbookId = String(formData.get("cookbookId") ?? "");
  const role = String(formData.get("role") ?? "viewer");
  const invite = await createInvite(user.id, cookbookId, role);
  redirect(`/loved-ones?invite=${invite.token}&cookbook=${cookbookId}`);
}
