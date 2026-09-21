import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { saveOnboarding } from "@/app/actions/onboarding";
import { getDb, schema } from "@/db/client";
import { requireUser } from "@/lib/auth";
import {
  DEFAULT_RECIPE_BOX_NAME,
  MAX_SERVINGS,
  MIN_SERVINGS,
  UNITS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/kitchen-prefs";
import { PREFERRED_UNITS, VISIBILITIES } from "@/lib/types";

const fieldClass = "rounded-xl border border-line bg-white px-3 py-3";

export default async function OnboardingPage() {
  // Fresh, not cached: this page is where a finished user lands if anything
  // upstream still believes onboarding is incomplete, and showing them the
  // form again is the bug this guards against.
  const user = await requireUser({ fresh: true });
  if (user.onboardingCompletedAt) {
    redirect("/recipes");
  }

  const db = getDb();
  const defaultCookbook = await db.query.cookbook.findFirst({
    where: and(eq(schema.cookbook.ownerId, user.id), eq(schema.cookbook.isDefault, true)),
    columns: { title: true },
  });

  return (
    <main className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="font-serif text-4xl">Welcome to Kitchen</h1>
        <p className="text-muted">Four quick choices. You can change any of them later in Settings.</p>
      </div>

      <form action={saveOnboarding} className="grid gap-6 rounded-2xl border border-line bg-white p-5">
        <fieldset className="grid gap-2 border-0 p-0">
          <legend className="font-medium">What should we call your recipe box?</legend>
          <p className="text-sm text-muted">This names the cookbook your recipes go into by default.</p>
          <input
            name="recipeBoxName"
            maxLength={60}
            defaultValue={defaultCookbook?.title ?? DEFAULT_RECIPE_BOX_NAME}
            className={fieldClass}
          />
        </fieldset>

        <fieldset className="grid gap-2 border-0 p-0">
          <legend className="font-medium">How many people do you usually cook for?</legend>
          <p className="text-sm text-muted">New recipes start at this many servings.</p>
          <input
            name="defaultServings"
            type="number"
            inputMode="numeric"
            min={MIN_SERVINGS}
            max={MAX_SERVINGS}
            defaultValue={user.defaultServings}
            className={`${fieldClass} w-28`}
          />
        </fieldset>

        <fieldset className="grid gap-2 border-0 p-0">
          <legend className="font-medium">Cups or grams?</legend>
          <select name="preferredUnits" defaultValue={user.preferredUnits} className={fieldClass}>
            {PREFERRED_UNITS.map((units) => (
              <option key={units} value={units}>
                {UNITS_LABELS[units]}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="grid gap-2 border-0 p-0">
          <legend className="font-medium">Who should see a new cookbook?</legend>
          <p className="text-sm text-muted">The starting point for each cookbook you make. Always changeable per cookbook.</p>
          <select
            name="defaultCookbookVisibility"
            defaultValue={user.defaultCookbookVisibility}
            className={fieldClass}
          >
            {VISIBILITIES.map((visibility) => (
              <option key={visibility} value={visibility}>
                {VISIBILITY_LABELS[visibility]}
              </option>
            ))}
          </select>
        </fieldset>

        <button type="submit" className="btn-clay btn-clay-hover w-fit rounded-xl px-5 py-3">
          Finish setup
        </button>
      </form>
    </main>
  );
}
