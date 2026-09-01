import Link from "next/link";
import { deleteAccount, updateProfile } from "@/app/actions/settings";
import { logOut } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { listMyCookbooks } from "@/lib/cookbooks";
import { PREFERRED_UNITS } from "@/lib/types";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { saved } = await searchParams;
  const cookbooks = await listMyCookbooks(user.id);
  const defaultCookbook = cookbooks.find((cookbook) => cookbook.isDefault);

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
            <span className="font-medium">Display name</span>
            <input
              name="name"
              required
              defaultValue={user.name}
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
            <span className="font-medium">Default servings</span>
            <input
              name="defaultServings"
              type="number"
              min={1}
              max={12}
              defaultValue={user.defaultServings}
              className="rounded-xl border border-line bg-white px-3 py-3"
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

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Cookbooks</h2>
        <p className="text-muted">
          Your default cookbook is{" "}
          {defaultCookbook ? (
            <Link href={`/cookbooks/${defaultCookbook.id}`} className="text-clay">
              {defaultCookbook.title}
            </Link>
          ) : (
            "not set yet"
          )}
          . New recipes land there first. Share cookbooks from each book&apos;s sharing page.
        </p>
        <Link href="/cookbooks" className="text-clay">
          Manage cookbooks
        </Link>
      </section>

      <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Account</h2>
        <form action={logOut}>
          <button type="submit" className="rounded-xl border border-line px-4 py-2">
            Sign out
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-red-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-red-800">Danger zone</h2>
        <p className="text-muted">
          Deleting your account removes your recipes, cookbooks, and notes. This cannot be undone.
        </p>
        <form action={deleteAccount} className="grid gap-3">
          <label className="grid gap-1">
            <span className="font-medium">Type your email to confirm</span>
            <input
              name="confirmEmail"
              type="email"
              required
              placeholder={user.email}
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
          <button type="submit" className="btn w-fit rounded-xl border border-red-300 px-4 py-2 text-red-800">
            Delete account
          </button>
        </form>
      </section>
    </main>
  );
}
