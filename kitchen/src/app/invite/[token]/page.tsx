import { joinFromInviteForm } from "@/app/actions/cookbooks";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.cookbookInvite.findUnique({
    where: { token },
    include: { cookbook: true },
  });
  if (!invite || invite.expiresAt < new Date()) {
    notFound();
  }
  const user = await getCurrentUser();

  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Join {invite.cookbook.title}</h1>
      <p>You are invited as {invite.role}.</p>
      {user ? (
        <form action={joinFromInviteForm}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
            Join this cookbook
          </button>
        </form>
      ) : (
        <p>
          <Link href={`/login`}>Sign in</Link> first, then open this invite link again.
        </p>
      )}
    </main>
  );
}
