import { saveInterview } from "@/app/actions/interview";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INTERVIEW_QUESTIONS } from "@/lib/types";

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { saved } = await searchParams;
  const existing = await prisma.interviewResponse.findUnique({ where: { userId: user.id } });
  const answers = existing ? (JSON.parse(existing.answers) as Record<string, string>) : {};

  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Mom interview</h1>
      <p className="text-muted">Sit together. Fill this in on the iPad. Answers stay in your account.</p>
      {saved === "1" ? <p className="rounded-xl border border-line bg-white p-3">Saved.</p> : null}
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
