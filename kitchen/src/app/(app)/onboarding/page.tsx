import { redirect } from "next/navigation";
import { saveOnboarding } from "@/app/actions/onboarding";
import { requireUser } from "@/lib/auth";
import { ONBOARDING_QUESTIONS } from "@/lib/types";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardingCompletedAt) {
    redirect("/recipes");
  }

  return (
    <main className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="font-serif text-4xl">Welcome to Kitchen</h1>
        <p className="text-muted">A few quick questions so we can tailor your recipe box.</p>
      </div>

      <form action={saveOnboarding} className="grid gap-6 rounded-2xl border border-line bg-white p-5">
        {ONBOARDING_QUESTIONS.map((question) => (
          <fieldset key={question.id} className="grid gap-2 border-0 p-0">
            <legend className="font-medium">{question.prompt}</legend>
            {question.type === "text" ? (
              <input
                name={question.id}
                required={question.id !== "householdNotes"}
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            ) : null}
            {question.type === "textarea" ? (
              <textarea
                name={question.id}
                rows={3}
                required={question.id !== "householdNotes"}
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            ) : null}
            {question.type === "select" ? (
              <select name={question.id} required className="rounded-xl border border-line bg-white px-3 py-3">
                <option value="">Choose one…</option>
                {question.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            {question.type === "checkboxes" ? (
              <div className="grid gap-2">
                {question.options.map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input type="checkbox" name={question.id} value={option.value} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </fieldset>
        ))}
        <button type="submit" className="btn-clay btn-clay-hover w-fit rounded-xl px-5 py-3">
          Finish setup
        </button>
      </form>
    </main>
  );
}
