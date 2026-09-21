"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { refreshSessionCache, requireUser } from "@/lib/auth";
import { readKitchenPrefs } from "@/lib/kitchen-prefs";
import { fullName } from "@/lib/user-name";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) {
    throw new Error("Enter your first and last name.");
  }
  // Same validator onboarding uses, so the two forms cannot drift apart.
  const prefs = readKitchenPrefs(formData);
  const name = fullName(firstName, lastName);
  const db = getDb();
  await db
    .update(schema.user)
    .set({
      firstName,
      lastName,
      name,
      defaultServings: prefs.defaultServings,
      preferredUnits: prefs.preferredUnits,
      defaultCookbookVisibility: prefs.defaultCookbookVisibility,
    })
    .where(eq(schema.user.id, user.id));
  await db
    .update(schema.cookbook)
    .set({ title: prefs.recipeBoxName })
    .where(and(eq(schema.cookbook.ownerId, user.id), eq(schema.cookbook.isDefault, true)));
  await refreshSessionCache();
  redirect("/settings?saved=1");
}
