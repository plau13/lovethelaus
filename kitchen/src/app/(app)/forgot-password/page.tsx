import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthNotice, AuthShell, authInputClass } from "@/components/AuthShell";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <AuthShell
      title="Forgot password"
      description="We'll email a link to reset your password. The link opens Kitchen to set a new one."
      footer={
        <Link href="/sign-in" className="text-clay hover:text-clay-dark">
          Back to sign in
        </Link>
      }
    >
      <AuthError message={error} />
      {sent === "1" ? (
        <AuthNotice message="If that email has an account, a reset link is on its way. Check your inbox." />
      ) : null}
      <form action={requestPasswordResetAction} className="grid gap-4">
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
          Send reset link
        </button>
      </form>
    </AuthShell>
  );
}
