"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { ONBOARDING_QUESTIONS } from "@/lib/types";

export async function saveOnboarding(formData: FormData) {
  const user = await requireUser();
  const answers: Record<string, string | string[]> = {};

  for (const question of ONBOARDING_QUESTIONS) {
    if (question.type === "checkboxes") {
      const values = formData.getAll(question.id).map((entry) => String(entry));
      answers[question.id] = values;
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

  const prisma = await getPrisma();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingAnswers: JSON.stringify(answers),
      onboardingCompletedAt: new Date(),
    },
  });

  redirect("/recipes");
}
