import { saveCookbook } from "@/app/actions/cookbooks";
import { requireUser } from "@/lib/auth";

export default async function NewCookbookPage() {
  await requireUser();
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
        <button type="submit" className="btn w-fit rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
          Create
        </button>
      </form>
    </main>
  );
}
