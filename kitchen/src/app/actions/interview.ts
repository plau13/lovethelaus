"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INTERVIEW_QUESTIONS } from "@/lib/types";

export async function saveInterview(formData: FormData) {
  const user = await requireUser();
  const answers: Record<string, string> = {};
  for (const question of INTERVIEW_QUESTIONS) {
    answers[question.id] = String(formData.get(question.id) ?? "").trim();
  }
  await prisma.interviewResponse.upsert({
    where: { userId: user.id },
    update: { answers: JSON.stringify(answers) },
    create: { userId: user.id, answers: JSON.stringify(answers) },
  });
  redirect("/interview?saved=1");
}
