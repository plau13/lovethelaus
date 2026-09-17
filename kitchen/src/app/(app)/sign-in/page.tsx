import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthNotice, AuthShell, authInputClass, authOutlineButtonClass } from "@/components/AuthShell";
import { safeReturnTo } from "@/lib/post-auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; returnTo?: string }>;
}) {
  const { error, reset, returnTo: returnToRaw } = await searchParams;
  const returnTo = safeReturnTo(returnToRaw);

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in with your email and password."
      footer={
        <>
          <Link href="/sign-up" className="text-clay hover:text-clay-dark">
            Create an account
          </Link>
          <Link href="/forgot-password" className="text-clay hover:text-clay-dark">
            Forgot password?
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      {reset === "1" ? <AuthNotice message="Password updated. Sign in with your new password." /> : null}
      <form action={signInAction} className="grid gap-4">
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
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
        <Link href={returnTo ? `/sign-in/one-time?returnTo=${encodeURIComponent(returnTo)}` : "/sign-in/one-time"} className={authOutlineButtonClass}>
          Send one-time login
        </Link>
      </form>
    </AuthShell>
  );
}
