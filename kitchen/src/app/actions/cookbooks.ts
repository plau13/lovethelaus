"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { redirectActionError } from "@/lib/action-result";
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
import { isVisibility } from "@/lib/kitchen-prefs";
import { reportError } from "@/lib/log";
import { parseEmailList } from "@/lib/parse-emails";
import { appUrl } from "@/lib/paths";
import { revalidatePublicCookbook } from "@/lib/revalidate-public";

export async function saveCookbook(formData: FormData) {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const submitted = String(formData.get("visibility") ?? "").trim();
    const preferred = isVisibility(user.defaultCookbookVisibility) ? user.defaultCookbookVisibility : "private";
    const visibility = isVisibility(submitted) ? submitted : preferred;
    const cookbook = await createCookbook(
      user.id,
      String(formData.get("title") ?? ""),
      String(formData.get("description") ?? ""),
      visibility,
    );
    redirect(`/cookbooks/${cookbook.id}`);
  } catch (error) {
    redirectActionError("/cookbooks/new", error, "cookbooks.create_failed", userId);
  }
}

export async function saveCookbookSettings(formData: FormData) {
  let userId: string | undefined;
  const cookbookId = String(formData.get("cookbookId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    await updateCookbookSettings({
      userId: user.id,
      cookbookId,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      visibility: String(formData.get("visibility") ?? "private"),
      familyName: String(formData.get("familyName") ?? ""),
      dedication: String(formData.get("dedication") ?? ""),
    });
    await revalidatePublicCookbook(cookbookId);
    redirect(`/cookbooks/${cookbookId}/settings`);
  } catch (error) {
    redirectActionError(
      cookbookId ? `/cookbooks/${cookbookId}/settings` : "/cookbooks",
      error,
      "cookbooks.settings_failed",
      userId,
    );
  }
}

export async function inviteToCookbook(formData: FormData) {
  let userId: string | undefined;
  const cookbookId = String(formData.get("cookbookId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const invite = await createInvite(user.id, cookbookId, String(formData.get("role") ?? "viewer"));
    redirect(`/cookbooks/${cookbookId}/settings?invite=${invite.token}`);
  } catch (error) {
    redirectActionError(
      cookbookId ? `/cookbooks/${cookbookId}/settings` : "/cookbooks",
      error,
      "cookbooks.invite_failed",
      userId,
    );
  }
}

export async function joinCookbook(token: string) {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const cookbookId = await acceptInvite(user.id, token);
    redirect(`/cookbooks/${cookbookId}`);
  } catch (error) {
    redirectActionError(token ? `/invite/${token}` : "/cookbooks", error, "cookbooks.join_failed", userId);
  }
}

export async function joinFromInviteForm(formData: FormData) {
  await joinCookbook(String(formData.get("token") ?? ""));
}

export async function putRecipeInCookbook(formData: FormData) {
  let userId: string | undefined;
  const cookbookId = String(formData.get("cookbookId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    await addRecipeToCookbook(user.id, cookbookId, String(formData.get("recipeId") ?? ""));
    await revalidatePublicCookbook(cookbookId);
    redirect(`/cookbooks/${cookbookId}`);
  } catch (error) {
    redirectActionError(cookbookId ? `/cookbooks/${cookbookId}` : "/cookbooks", error, "cookbooks.add_recipe_failed", userId);
  }
}

export async function toggleFavorite(formData: FormData) {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const cookbookId = String(formData.get("cookbookId") ?? "");
    await toggleCookbookFavorite(user.id, cookbookId);
  } catch (error) {
    reportError("cookbooks.favorite_failed", error, userId ? { userId } : undefined);
    throw error;
  }
}

export async function grantCookbookAccessBatch(formData: FormData) {
  let userId: string | undefined;
  const cookbookId = String(formData.get("cookbookId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const role = String(formData.get("role") ?? "viewer");
    const emails = parseEmailList(String(formData.get("emails") ?? ""));

    if (emails.length === 0) {
      throw new Error("Add at least one email address.");
    }

    for (const email of emails) {
      await addCookbookMemberByEmail({
        ownerId: user.id,
        cookbookId,
        email,
        role,
      });
    }

    revalidatePath(`/cookbooks/${cookbookId}`);
  } catch (error) {
    redirectActionError(cookbookId ? `/cookbooks/${cookbookId}` : "/cookbooks", error, "cookbooks.grant_batch_failed", userId);
  }
}

export async function revokeCookbookAccess(formData: FormData) {
  let userId: string | undefined;
  const cookbookId = String(formData.get("cookbookId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    const memberUserId = String(formData.get("memberUserId") ?? "");

    await removeCookbookMember({
      ownerId: user.id,
      cookbookId,
      userId: memberUserId,
    });

    revalidatePath(`/cookbooks/${cookbookId}`);
  } catch (error) {
    redirectActionError(cookbookId ? `/cookbooks/${cookbookId}` : "/cookbooks", error, "cookbooks.revoke_failed", userId);
  }
}

export async function createCookbookInviteLink(cookbookId: string, role: string): Promise<string> {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const invite = await createInvite(user.id, cookbookId, role);
    return appUrl(`/invite/${invite.token}`);
  } catch (error) {
    reportError("cookbooks.invite_link_failed", error, userId ? { userId } : undefined);
    throw error;
  }
}
