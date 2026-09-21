import { eq } from "drizzle-orm";
import { saveInterview } from "@/app/actions/interview";
import { QueryFlash } from "@/components/QueryFlash";
import { getDb, schema } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { INTERVIEW_QUESTIONS } from "@/lib/types";

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { saved, error } = await searchParams;
  const db = getDb();
  const existing = await db.query.interviewResponse.findFirst({ where: eq(schema.interviewResponse.userId, user.id) });
  const answers = existing ? (JSON.parse(existing.answers) as Record<string, string>) : {};

  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Mom interview</h1>
      <p className="text-muted">Sit together. Fill this in on the iPad. Answers stay in your account.</p>
      <QueryFlash error={error} saved={saved === "1" ? "1" : null} />
      <form action={saveInterview} className="grid gap-5">
        {INTERVIEW_QUESTIONS.map((question) => (
          <label key={question.id} className="grid gap-1">
            <span className="font-medium">{question.prompt}</span>
            <textarea
              name={question.id}
              rows={3}
              defaultValue={answers[question.id] ?? ""}
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
        ))}
        <button type="submit" className="btn w-fit rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
          Save answers
        </button>
      </form>
    </main>
  );
}
