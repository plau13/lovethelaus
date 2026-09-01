import { startImport } from "@/app/actions/import";
import { requireUser } from "@/lib/auth";

export default async function ImportPage() {
  await requireUser();
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Import</h1>
      <p className="text-muted">
        Paste a food blog URL first (those usually have a recipe card). Instagram and TikTok become a draft you confirm.
        We keep the original link. We do not download the video.
      </p>
      <form action={startImport} className="grid gap-4">
        <label className="grid gap-1">
          <span>Link</span>
          <input
            name="url"
            type="url"
            required
            placeholder="https://"
            className="rounded-xl border border-line bg-white px-3 py-3"
          />
        </label>
        <button type="submit" className="btn w-fit rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
          Fetch draft
        </button>
      </form>
    </main>
  );
}
