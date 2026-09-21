import { saveCookbook } from "@/app/actions/cookbooks";
import { requireOnboardedUser } from "@/lib/auth";
import { VISIBILITY_LABELS } from "@/lib/kitchen-prefs";
import { VISIBILITIES } from "@/lib/types";

export default async function NewCookbookPage() {
  const user = await requireOnboardedUser();
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">New cookbook</h1>
      <form action={saveCookbook} className="grid gap-4">
        <label className="grid gap-1">
          <span>Title</span>
          <input name="title" required className="rounded-xl border border-line bg-white px-3 py-3" />
        </label>
        <label className="grid gap-1">
          <span>Description</span>
          <textarea name="description" rows={3} className="rounded-xl border border-line bg-white px-3 py-3" />
        </label>
        <label className="grid gap-1">
          <span>Visible to</span>
          <select
            name="visibility"
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
          Create
        </button>
      </form>
    </main>
  );
}
