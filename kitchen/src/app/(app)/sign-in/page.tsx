import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthNotice, AuthShell, authInputClass, authOutlineButtonClass } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import { demoPassword } from "@/lib/demo-account";
import { appPath } from "@/lib/paths";
import { postAuthPath, safeReturnTo } from "@/lib/post-auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; returnTo?: string }>;
}) {
  const { error, reset, returnTo: returnToRaw } = await searchParams;
  const returnTo = safeReturnTo(returnToRaw);
  const user = await getCurrentUser();
  if (user) {
    redirect(postAuthPath(user, returnTo));
  }
  // Same helper the route uses, so the button cannot appear when pressing it
  // would only redirect back here with an error.
  const demoAvailable = demoPassword(process.env).length > 0;

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
        {demoAvailable ? (
          // A plain anchor, not <Link>: this route signs you in on GET, and Next
          // prefetches Link targets on hover and in the viewport. Bypassing the
          // router also bypasses basePath, so the href comes from appPath().
          <a href={appPath("/api/auth/demo")} className={authOutlineButtonClass}>
            Try the demo
          </a>
        ) : null}
      </form>
    </AuthShell>
  );
}
