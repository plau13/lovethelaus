import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthShell, authInputClass, authOutlineButtonClass } from "@/components/AuthShell";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
        <Link href="/sign-in/one-time" className={authOutlineButtonClass}>
          Send one-time login
        </Link>
      </form>
    </AuthShell>
  );
}
