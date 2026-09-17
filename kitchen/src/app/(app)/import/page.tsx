import { startImport } from "@/app/actions/import";
import { requireOnboardedUser } from "@/lib/auth";
import { isSubscriber, socialImportRemaining } from "@/lib/subscription";

export default async function ImportPage() {
  const user = await requireOnboardedUser();
  const remaining = socialImportRemaining(user);
  const limitLabel = isSubscriber(user)
    ? "about 10 Instagram/TikTok imports per month"
    : "3 Instagram/TikTok imports (lifetime)";

  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Import</h1>
      <p className="text-muted">
        Paste a food blog URL first (those usually have a recipe card). Instagram and TikTok read the caption to
        draft a recipe; video analysis is planned. You confirm before saving. We keep the original link — we do not
        re-host the video.
      </p>
      <p className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
        Social imports remaining: <strong>{remaining ?? 0}</strong> ({limitLabel})
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
