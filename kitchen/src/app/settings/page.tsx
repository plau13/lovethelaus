import { logOut } from "@/app/actions/auth";
import { updateProfile } from "@/app/actions/settings";
import { requireOnboardedUser } from "@/lib/auth";
import { exportSummary, recipesForExport } from "@/lib/export-eligibility";
import { getPrisma } from "@/lib/prisma";
import {
  formatOnboardingAnswer,
  ONBOARDING_QUESTIONS,
  parseOnboardingAnswers,
  PREFERRED_UNITS,
} from "@/lib/types";
import { isSubscriber } from "@/lib/subscription";

function supportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? "preston.lau13@gmail.com";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { saved } = await searchParams;
  const prisma = await getPrisma();
  const exportable = await recipesForExport(user.id);
  const ownedOnly = await prisma.recipe.count({ where: { ownerId: user.id } });
  const onboardingAnswers = parseOnboardingAnswers(user.onboardingAnswers);

  return (
    <main className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="font-serif text-4xl">Settings</h1>
        {saved ? <p className="text-clay">Saved.</p> : null}
      </div>

      <section className="grid gap-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Profile</h2>
        <form action={updateProfile} className="grid gap-4">
          <label className="grid gap-1">
            <span className="font-medium">First name</span>
            <input
              name="firstName"
              required
              defaultValue={user.firstName}
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Last name</span>
            <input
              name="lastName"
              required
              defaultValue={user.lastName}
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Email</span>
            <input
              value={user.email}
              readOnly
              className="rounded-xl border border-line bg-paper px-3 py-3 text-muted"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Preferred units</span>
            <select
              name="preferredUnits"
              defaultValue={user.preferredUnits}
              className="rounded-xl border border-line bg-white px-3 py-3"
            >
              {PREFERRED_UNITS.map((units) => (
                <option key={units} value={units}>
                  {units === "us" ? "US (cups, °F)" : "Metric (g, ml, °C)"}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn w-fit rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
            Save profile
          </button>
        </form>
      </section>

      {user.onboardingCompletedAt ? (
        <section className="grid gap-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-xl font-semibold">Onboarding</h2>
          <p className="text-muted text-sm">Your answers from setup. Contact us if anything needs updating.</p>
          <dl className="grid gap-3">
            {ONBOARDING_QUESTIONS.map((question) => (
              <div key={question.id} className="grid gap-1">
                <dt className="text-sm font-medium">{question.prompt}</dt>
                <dd className="text-muted">{formatOnboardingAnswer(onboardingAnswers[question.id])}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Export recipes</h2>
        <p className="text-muted">{exportSummary(user, exportable.length, ownedOnly)}</p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/export?format=json" className="rounded-xl bg-clay px-4 py-2 text-white no-underline">
            Download JSON
          </a>
          <a href="/api/export?format=csv" className="rounded-xl border border-line px-4 py-2 text-clay no-underline">
            Download CSV
          </a>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Plan</h2>
        <p className="text-muted">
          Current plan: <strong>{isSubscriber(user) ? "Subscriber" : "Free"}</strong>
          {isSubscriber(user) ? " — offline cook mode enabled." : " — subscribe to export shared recipes and cook offline."}
        </p>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Account</h2>
        <form action={logOut}>
          <button type="submit" className="rounded-xl border border-line px-4 py-2">
            Sign out
          </button>
        </form>
        <p className="text-muted text-sm">
          To delete your account, email{" "}
          <a href={`mailto:${supportEmail()}`} className="text-clay">
            {supportEmail()}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
