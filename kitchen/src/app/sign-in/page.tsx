import Link from "next/link";
import { magicLinkAction, signInAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthNotice, AuthShell, authInputClass } from "@/components/AuthShell";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Use email and password, a magic link, or try the demo."
      footer={
        <>
          <Link href="/sign-up" className="text-clay hover:text-clay-dark">
            Create an account
          </Link>
          {" · "}
          <Link href="/forgot-password" className="text-clay hover:text-clay-dark">
            Forgot password?
          </Link>
        </>
      }
    >
      <AuthError message={error === "demo-unavailable" ? "Demo is not configured on this server." : error} />
      {sent === "magic-link" ? (
        <AuthNotice message="Check your email for a sign-in link." />
      ) : null}
      <form action={signInAction} className="grid gap-4">
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
        <AuthField label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={authInputClass}
          />
        </AuthField>
        <button type="submit" className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark">
          Sign in
        </button>
      </form>
      <form action={magicLinkAction} className="grid gap-4">
        <AuthField label="Or email me a magic link">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={authInputClass}
            placeholder="you@example.com"
          />
        </AuthField>
        <button type="submit" className="rounded-xl border border-line bg-white px-5 py-3 text-lg text-clay hover:border-clay">
          Send magic link
        </button>
      </form>
      <div className="grid gap-2">
        <button type="button" disabled className="rounded-xl border border-line bg-paper px-5 py-3 text-muted">
          Sign in with Apple — coming soon
        </button>
        <button type="button" disabled className="rounded-xl border border-line bg-paper px-5 py-3 text-muted">
          Sign in with Google — coming soon
        </button>
      </div>
      <p>
        <Link
          href="/api/auth/demo"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-white px-5 py-3 text-lg text-clay no-underline hover:border-clay"
        >
          Try demo
        </Link>
      </p>
    </AuthShell>
  );
}
