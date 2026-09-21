"use server";

import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { redirectActionError } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { INTERVIEW_QUESTIONS } from "@/lib/types";

export async function saveInterview(formData: FormData) {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const answers: Record<string, string> = {};
    for (const question of INTERVIEW_QUESTIONS) {
      answers[question.id] = String(formData.get(question.id) ?? "").trim();
    }
    const db = getDb();
    await db
      .insert(schema.interviewResponse)
      .values({ userId: user.id, answers: JSON.stringify(answers) })
      .onConflictDoUpdate({ target: schema.interviewResponse.userId, set: { answers: JSON.stringify(answers) } });
    redirect("/interview?saved=1");
  } catch (error) {
    redirectActionError("/interview", error, "interview.save_failed", userId);
  }
}
