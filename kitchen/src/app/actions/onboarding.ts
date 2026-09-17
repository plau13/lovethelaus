"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { refreshSessionCache, requireUser } from "@/lib/auth";
import { ONBOARDING_QUESTIONS } from "@/lib/types";

export async function saveOnboarding(formData: FormData) {
  const user = await requireUser();
  const answers: Record<string, string | string[]> = {};

  for (const question of ONBOARDING_QUESTIONS) {
    if (question.type === "checkboxes") {
      answers[question.id] = formData.getAll(question.id).map((entry) => String(entry));
      continue;
    }
    const value = String(formData.get(question.id) ?? "").trim();
    if (question.id !== "householdNotes" && !value) {
      throw new Error(`Answer "${question.prompt}" is required.`);
    }
    if (value) {
      answers[question.id] = value;
    }
  }

  const db = getDb();
  await db
    .update(schema.user)
    .set({ onboardingAnswers: JSON.stringify(answers), onboardingCompletedAt: new Date() })
    .where(eq(schema.user.id, user.id));
  await refreshSessionCache();

  redirect("/recipes");
}
