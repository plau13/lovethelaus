import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import { AuthError, AuthField, AuthShell, authInputClass } from "@/components/AuthShell";

export function ResetPasswordForm({ token, error }: { token: string | null; error?: string }) {
  if (!token) {
    return (
      <AuthShell
        title="Reset password"
        description="Open the link from your email to set a new password."
        footer={
          <Link href="/forgot-password" className="text-clay hover:text-clay-dark">
            Request a new link
          </Link>
        }
      >
        <AuthError message={error ?? "That link is invalid or expired. Request a new one."} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" description="Choose a password for your Kitchen account.">
      <AuthError message={error} />
      <form action={resetPasswordAction} className="grid gap-4">
        <input type="hidden" name="token" value={token} />
        <AuthField label="New password">
          <input type="password" name="password" required minLength={8} autoComplete="new-password" className={authInputClass} />
        </AuthField>
        <AuthField label="Confirm password">
          <input type="password" name="confirm" required minLength={8} autoComplete="new-password" className={authInputClass} />
        </AuthField>
        <button type="submit" className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark">
          Save password
        </button>
      </form>
    </AuthShell>
  );
}
