import Link from "next/link";
import { notFound } from "next/navigation";
import { joinFromInviteForm } from "@/app/actions/cookbooks";
import { QueryFlash } from "@/components/QueryFlash";
import { getCurrentUser } from "@/lib/auth";
import { getInvite } from "@/lib/cookbooks";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const invite = await getInvite(token);
  if (!invite) {
    notFound();
  }
  const user = await getCurrentUser();
  const returnTo = `/invite/${token}`;
  const signUpHref = `/sign-up?returnTo=${encodeURIComponent(returnTo)}${invite.email ? `&email=${encodeURIComponent(invite.email)}` : ""}`;
  const signInHref = `/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
  const wrongAccount = Boolean(user && invite.email && user.email.toLowerCase() !== invite.email.toLowerCase());

  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Join {invite.cookbook.title}</h1>
      <QueryFlash error={error} />
      <p>
        {invite.invitedBy?.name ? `${invite.invitedBy.name} invited you` : "You are invited"} as {invite.role}.
      </p>
      {user && !wrongAccount ? (
        <form action={joinFromInviteForm}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
            Join this cookbook
          </button>
        </form>
      ) : wrongAccount ? (
        <p className="rounded-xl border border-line bg-white p-4">
          This invite was sent to <strong>{invite.email}</strong>. You are signed in as {user?.email}. Sign out and sign in
          with the invited address to join.
        </p>
      ) : (
        <div className="grid gap-3 rounded-2xl border border-line bg-white p-5">
          <p>Create a free Kitchen account{invite.email ? ` with ${invite.email}` : ""} to join, or sign in if you already have one.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={signUpHref} className="btn-clay btn-clay-hover inline-flex min-h-12 items-center rounded-xl px-5 py-3 no-underline">
              Create account
            </Link>
            <Link href={signInHref} className="inline-flex min-h-12 items-center rounded-xl border border-line px-5 py-3 text-ink no-underline hover:bg-paper">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
