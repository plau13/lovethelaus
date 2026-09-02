import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthShell, authInputClass } from "@/components/AuthShell";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Create account"
      description="Start your family recipe box. You'll get a private cookbook on first sign-in."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="text-clay hover:text-clay-dark">
            Sign in
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      <form action={signUpAction} className="grid gap-4">
        <AuthField label="Your name">
          <input name="name" className={authInputClass} placeholder="Mom" autoComplete="name" />
        </AuthField>
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
            minLength={8}
            autoComplete="new-password"
            className={authInputClass}
          />
        </AuthField>
        <button type="submit" className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark">
          Create account
        </button>
      </form>
    </AuthShell>
  );
}
