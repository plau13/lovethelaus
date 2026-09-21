import { and, count, eq } from "drizzle-orm";
import { logOut } from "@/app/actions/auth";
import { openBillingPortal, refreshPlan, startCheckout } from "@/app/actions/billing";
import { updateProfile } from "@/app/actions/settings";
import { QueryFlash } from "@/components/QueryFlash";
import { ReportProblemButton } from "@/components/ReportProblemButton";
import { getDb, schema } from "@/db/client";
import { requireOnboardedUser } from "@/lib/auth";
import { subscriptionSummary } from "@/lib/billing";
import { exportSummary, recipesForExport } from "@/lib/export-eligibility";
import { availableIntervals, isBillingConfigured } from "@/lib/stripe";
import {
  DEFAULT_RECIPE_BOX_NAME,
  MAX_SERVINGS,
  MIN_SERVINGS,
  UNITS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/kitchen-prefs";
import { PREFERRED_UNITS, VISIBILITIES } from "@/lib/types";
import { isSubscriber } from "@/lib/subscription";

function supportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || "preston.lau13@gmail.com";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; checkout?: string; error?: string }>;
}) {
  const { saved, checkout, error } = await searchParams;
  // After Checkout the webhook may land a moment later; bypass the session cookie cache.
  const user = await requireOnboardedUser({ fresh: checkout === "success" });
  const db = getDb();
  const [exportable, [{ total: ownedOnly }], defaultCookbook] = await Promise.all([
    recipesForExport(user.id),
    db.select({ total: count() }).from(schema.recipe).where(eq(schema.recipe.ownerId, user.id)),
    db.query.cookbook.findFirst({
      where: and(eq(schema.cookbook.ownerId, user.id), eq(schema.cookbook.isDefault, true)),
      columns: { title: true },
    }),
  ]);
  const plan = subscriptionSummary(user);
  const subscribed = isSubscriber(user);
  const billingReady = isBillingConfigured();
  const intervals = availableIntervals();
  const activating = checkout === "success" && !subscribed;

  return (
    <main className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="font-serif text-4xl">Settings</h1>
        <QueryFlash error={error} saved={saved} checkout={checkout} />
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
                  {UNITS_LABELS[units]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Recipe box name</span>
            <span className="text-sm text-muted">The cookbook new recipes go into by default.</span>
            <input
              name="recipeBoxName"
              maxLength={60}
              defaultValue={defaultCookbook?.title ?? DEFAULT_RECIPE_BOX_NAME}
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Default servings</span>
            <span className="text-sm text-muted">What a new recipe starts at.</span>
            <input
              name="defaultServings"
              type="number"
              inputMode="numeric"
              min={MIN_SERVINGS}
              max={MAX_SERVINGS}
              defaultValue={user.defaultServings}
              className="w-28 rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">New cookbooks are visible to</span>
            <select
              name="defaultCookbookVisibility"
              defaultValue={user.defaultCookbookVisibility}
              className="rounded-xl border border-line bg-white px-3 py-3"
            >
              {VISIBILITIES.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {VISIBILITY_LABELS[visibility]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn w-fit rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
            Save profile
          </button>
        </form>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Export recipes</h2>
        <p className="text-muted">{exportSummary(user, exportable.length, Number(ownedOnly))}</p>
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
        {activating ? (
          <>
            <meta httpEquiv="refresh" content="3" />
            <p className="text-clay">Thanks! Activating Kitchen Plus…</p>
            <form action={refreshPlan}>
              <button type="submit" className="rounded-xl border border-line px-4 py-2">
                Refresh
              </button>
            </form>
          </>
        ) : (
          <p className="text-muted">
            Current plan: <strong>{plan.planLabel}</strong> — {plan.statusLine}
          </p>
        )}
        {!activating && billingReady ? (
          subscribed ? (
            <form action={openBillingPortal}>
              <button type="submit" className="rounded-xl border border-line px-4 py-2">
                Manage billing
              </button>
            </form>
          ) : (
            <div className="grid gap-3">
              <ul className="list-disc pl-5 text-muted">
                <li>Unlimited card photos and voice memos on every recipe</li>
                <li>Claude reads a handwritten card into the recipe</li>
                <li>The print-ready family cookbook</li>
                <li>Export shared recipes, not just your own</li>
                <li>Offline cook mode</li>
                <li>About 10 Instagram/TikTok imports a month</li>
              </ul>
              <div className="flex flex-wrap gap-3">
                {intervals.map((interval) => (
                  <form action={startCheckout} key={interval}>
                    <input type="hidden" name="interval" value={interval} />
                    <button
                      type="submit"
                      className={
                        interval === "yearly"
                          ? "btn rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark"
                          : "btn rounded-xl border border-line bg-white px-5 py-3"
                      }
                    >
                      {interval === "yearly" ? "$50 a year" : "$5 a month"}
                    </button>
                  </form>
                ))}
              </div>
              {intervals.length > 1 ? (
                <p className="text-sm text-muted">A year costs the same as ten months.</p>
              ) : null}
            </div>
          )
        ) : null}
        {!billingReady ? <p className="text-sm text-muted">Billing is not set up in this environment yet.</p> : null}
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
        <ReportProblemButton />
      </section>
    </main>
  );
}
