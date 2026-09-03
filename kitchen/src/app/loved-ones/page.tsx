import Link from "next/link";
import { grantRecipeAccess, revokeRecipeAccess } from "@/app/actions/collaborators";
import {
  createCookbookInviteFromHub,
  grantCookbookAccess,
  revokeCookbookAccess,
} from "@/app/actions/loved-ones";
import { requireUser } from "@/lib/auth";
import { listOwnedSharing } from "@/lib/sharing";
import { collabRoleLabel, RECIPE_COLLAB_ROLES } from "@/lib/types";

function cookbookRoleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}

export default async function LovedOnesPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; cookbook?: string }>;
}) {
  const user = await requireUser();
  const { invite, cookbook: inviteCookbookId } = await searchParams;
  const { cookbooks, recipes, uniquePeopleCount } = await listOwnedSharing(user.id);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000/kitchen";
  const inviteUrl = invite ? `${appUrl}/invite/${invite}` : null;

  return (
    <main className="grid gap-8">
      <section className="grid gap-2">
        <h1 className="font-serif text-4xl">Loved Ones</h1>
        <p className="text-muted leading-relaxed">
          Invite family, see who can access your cookbooks and recipes, and remove access when needed.
          {uniquePeopleCount > 0 ? ` ${uniquePeopleCount} people have shared access.` : null}
        </p>
      </section>

      {inviteUrl ? (
        <p className="rounded-xl border border-line bg-white p-4">
          Invite link for cookbook — send this to your loved one:{" "}
          <a href={inviteUrl} className="break-all">
            {inviteUrl}
          </a>
          {inviteCookbookId ? (
            <>
              {" "}
              (<Link href={`/cookbooks/${inviteCookbookId}`}>view cookbook</Link>)
            </>
          ) : null}
        </p>
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Cookbooks</h2>
        {cookbooks.length === 0 ? (
          <p className="text-muted">
            No cookbooks yet.{" "}
            <Link href="/cookbooks/new" className="text-clay">
              Create one
            </Link>
          </p>
        ) : (
          <ul className="grid gap-4">
            {cookbooks.map((cookbook) => {
              const otherMembers = cookbook.members.filter((member) => member.userId !== user.id);
              return (
                <li key={cookbook.id} className="grid gap-4 rounded-2xl border border-line bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/cookbooks/${cookbook.id}`} className="font-serif text-2xl text-ink no-underline">
                      {cookbook.title}
                    </Link>
                    <Link href={`/cookbooks/${cookbook.id}/settings`} className="text-sm text-clay">
                      Sharing settings
                    </Link>
                  </div>

                  {otherMembers.length === 0 ? (
                    <p className="text-sm text-muted">Not shared with anyone yet.</p>
                  ) : (
                    <ul className="grid gap-2 text-sm">
                      {otherMembers.map((member) => (
                        <li
                          key={member.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
                        >
                          <span>
                            {member.user.name} ({member.user.email}) — {cookbookRoleLabel(member.role)}
                          </span>
                          <form action={revokeCookbookAccess}>
                            <input type="hidden" name="cookbookId" value={cookbook.id} />
                            <input type="hidden" name="memberUserId" value={member.userId} />
                            <button type="submit" className="text-clay">
                              Remove
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form action={grantCookbookAccess} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <input type="hidden" name="cookbookId" value={cookbook.id} />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="family@example.com"
                      className="rounded-xl border border-line bg-white px-3 py-2"
                    />
                    <select name="role" className="rounded-xl border border-line bg-white px-3 py-2" defaultValue="viewer">
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button type="submit" className="btn-clay btn-clay-hover rounded-xl px-4 py-2">
                      Invite by email
                    </button>
                  </form>

                  <form action={createCookbookInviteFromHub} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="cookbookId" value={cookbook.id} />
                    <label className="grid gap-1 text-sm">
                      <span className="text-muted">Or create a link invite</span>
                      <select name="role" className="rounded-xl border border-line bg-white px-3 py-2" defaultValue="viewer">
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    </label>
                    <button type="submit" className="rounded-xl border border-line px-4 py-2 hover:bg-paper">
                      Create invite link
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Recipes</h2>
        {recipes.length === 0 ? (
          <p className="text-muted">
            No recipes yet.{" "}
            <Link href="/recipes/new" className="text-clay">
              Add one
            </Link>
          </p>
        ) : (
          <ul className="grid gap-4">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="grid gap-4 rounded-2xl border border-line bg-white p-5">
                <Link href={`/recipes/${recipe.id}`} className="font-serif text-2xl text-ink no-underline">
                  {recipe.title}
                </Link>

                {recipe.collaborators.length === 0 ? (
                  <p className="text-sm text-muted">Not shared with anyone yet.</p>
                ) : (
                  <ul className="grid gap-2 text-sm">
                    {recipe.collaborators.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
                      >
                        <span>
                          {entry.user.name} ({entry.user.email}) — {collabRoleLabel(entry.role)}
                        </span>
                        <form action={revokeRecipeAccess}>
                          <input type="hidden" name="recipeId" value={recipe.id} />
                          <input type="hidden" name="collaboratorUserId" value={entry.userId} />
                          <button type="submit" className="text-clay">
                            Remove
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <form action={grantRecipeAccess} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <input type="hidden" name="recipeId" value={recipe.id} />
                  <input type="hidden" name="returnTo" value="loved-ones" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="family@example.com"
                    className="rounded-xl border border-line bg-white px-3 py-2"
                  />
                  <select name="role" className="rounded-xl border border-line bg-white px-3 py-2" defaultValue="view">
                    {RECIPE_COLLAB_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {collabRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-clay btn-clay-hover rounded-xl px-4 py-2">
                    Invite by email
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
