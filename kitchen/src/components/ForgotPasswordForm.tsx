"use client";

import { useFormStatus } from "react-dom";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { AuthError, AuthField, authInputClass } from "@/components/AuthShell";
import { AuthSpinner } from "@/components/AuthSpinner";
import { AuthSuccessMark } from "@/components/AuthSuccessMark";

const SENT_MESSAGE = "If that email has an account, a reset link is on its way. Check your inbox.";

function SendResetButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn flex items-center justify-center gap-2 rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark disabled:cursor-wait disabled:opacity-90"
    >
      {pending ? <AuthSpinner /> : null}
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm({ error, sent }: { error?: string; sent?: boolean }) {
  if (sent) {
    return (
      <>
        <AuthError message={error} />
        <AuthSuccessMark message={SENT_MESSAGE} />
      </>
    );
  }

  return (
    <>
      <AuthError message={error} />
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
        <SendResetButton />
      </form>
    </>
  );
}
