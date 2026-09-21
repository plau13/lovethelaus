"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { refreshSessionCache, requireUser } from "@/lib/auth";
import { readKitchenPrefs } from "@/lib/kitchen-prefs";

/**
 * Finish setup. Every field here changes something the cook will see:
 * the name on their recipe box, what a new recipe's servings start at, which
 * units recipes are shown in, and who a new cookbook is visible to.
 */
export async function saveOnboarding(formData: FormData) {
  const user = await requireUser();
  const prefs = readKitchenPrefs(formData);
  const db = getDb();

  await db
    .update(schema.user)
    .set({
      defaultServings: prefs.defaultServings,
      preferredUnits: prefs.preferredUnits,
      defaultCookbookVisibility: prefs.defaultCookbookVisibility,
      onboardingCompletedAt: new Date(),
    })
    .where(eq(schema.user.id, user.id));

  // The default cookbook is created at signup and titled "My recipes"; this is
  // where it gets the name its owner chose.
  await db
    .update(schema.cookbook)
    .set({ title: prefs.recipeBoxName })
    .where(and(eq(schema.cookbook.ownerId, user.id), eq(schema.cookbook.isDefault, true)));

  await refreshSessionCache();
  redirect("/recipes");
}
