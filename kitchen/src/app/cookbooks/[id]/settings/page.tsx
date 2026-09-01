import Link from "next/link";
import { notFound } from "next/navigation";
import { inviteToCookbook, saveCookbookSettings } from "@/app/actions/cookbooks";
import { requireUser } from "@/lib/auth";
import { getCookbookForUser, memberRole } from "@/lib/cookbooks";
import { canManageCookbook } from "@/lib/permissions";

export default async function CookbookSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { invite } = await searchParams;
  const cookbook = await getCookbookForUser(id, user.id);
  const role = await memberRole(id, user.id);
  if (!cookbook || !canManageCookbook(role)) {
    notFound();
  }
  const shareUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/c/${cookbook.slug}`;
  const inviteUrl = invite
    ? `${process.env.APP_URL ?? "http://localhost:3000"}/invite/${invite}`
    : null;

  return (
    <main className="grid gap-8">
      <p className="text-muted">
        <Link href={`/cookbooks/${cookbook.id}`}>Back to {cookbook.title}</Link>
      </p>
      <h1 className="font-serif text-4xl">Sharing</h1>
      {inviteUrl ? (
        <p className="rounded-xl border border-line bg-white p-4">
          Invite link (send this):{" "}
          <a href={inviteUrl} className="break-all">
            {inviteUrl}
          </a>
        </p>
      ) : null}
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
          Save sharing
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
      <form action={inviteToCookbook} className="grid gap-3 rounded-2xl border border-line bg-white p-4">
        <input type="hidden" name="cookbookId" value={cookbook.id} />
        <label className="grid gap-1">
          <span>Invite role</span>
          <select name="role" defaultValue="viewer" className="rounded-xl border border-line bg-white px-3 py-3">
            <option value="viewer">Viewer — cook and leave notes</option>
            <option value="editor">Editor — add their own recipes to this book</option>
          </select>
        </label>
        <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2">
          Create invite link
        </button>
      </form>
      <section>
        <h2 className="mb-2 text-xl font-semibold">People</h2>
        <ul>
          {cookbook.members.map((member) => (
            <li key={member.id}>
              {member.user.name} ({member.user.email}) — {member.role}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
