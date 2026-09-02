import Link from "next/link";
import { magicLinkAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthNotice, AuthShell, authInputClass } from "@/components/AuthShell";

export default async function OneTimeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <AuthShell
      title="One-time login"
      description="Enter your email and we'll send you a link to sign in."
      footer={
        <Link href="/sign-in" className="text-clay hover:text-clay-dark">
          Back to sign in
        </Link>
      }
    >
      <AuthError message={error} />
      {sent === "magic-link" ? (
        <AuthNotice message="Check your email for a sign-in link." />
      ) : null}
      <form action={magicLinkAction} className="grid gap-4">
        <input type="hidden" name="returnTo" value="/sign-in/one-time" />
        <AuthField label="Email">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={authInputClass}
            placeholder="you@example.com"
          />
        </AuthField>
        <button type="submit" className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark">
          Send one-time login
        </button>
      </form>
    </AuthShell>
  );
}
