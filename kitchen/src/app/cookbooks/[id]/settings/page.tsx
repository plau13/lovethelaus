import Link from "next/link";
import { notFound } from "next/navigation";
import { saveCookbookSettings } from "@/app/actions/cookbooks";
import { requireOnboardedUser } from "@/lib/auth";
import { getCookbookForUser, memberRole } from "@/lib/cookbooks";
import { canManageCookbook } from "@/lib/permissions";

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000/kitchen";
}

export default async function CookbookSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const cookbook = await getCookbookForUser(id, user.id);
  const role = await memberRole(id, user.id);
  if (!cookbook || !canManageCookbook(role)) {
    notFound();
  }
  const shareUrl = `${appUrl()}/c/${cookbook.slug}`;

  return (
    <main className="grid gap-8">
      <p className="text-muted">
        <Link href={`/cookbooks/${cookbook.id}`}>Back to {cookbook.title}</Link>
      </p>
      <h1 className="font-serif text-4xl">Cookbook settings</h1>
      <p className="text-muted">Invite family from the share button on the cookbook page.</p>
      <form action={saveCookbookSettings} className="grid gap-4">
        <input type="hidden" name="cookbookId" value={cookbook.id} />
        <label className="grid gap-1">
          <span>Title</span>
          <input name="title" defaultValue={cookbook.title} className="rounded-xl border border-line bg-white px-3 py-3" />
        </label>
        <label className="grid gap-1">
          <span>Description</span>
          <textarea
            name="description"
            defaultValue={cookbook.description}
            rows={3}
            className="rounded-xl border border-line bg-white px-3 py-3"
          />
        </label>
        <label className="grid gap-1">
          <span>Visibility</span>
          <select name="visibility" defaultValue={cookbook.visibility} className="rounded-xl border border-line bg-white px-3 py-3">
            <option value="private">Private — members only</option>
            <option value="unlisted">Unlisted — anyone with the link</option>
            <option value="public">Public — listed at /c/{cookbook.slug}</option>
          </select>
        </label>
        <button type="submit" className="btn w-fit rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
          Save settings
        </button>
      </form>
      {(cookbook.visibility === "unlisted" || cookbook.visibility === "public") && (
        <p>
          Share link:{" "}
          <a href={shareUrl} className="break-all">
            {shareUrl}
          </a>
        </p>
      )}
    </main>
  );
}
