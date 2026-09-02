"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { AuthError, AuthField, AuthShell, authInputClass } from "@/components/AuthShell";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/recipes");
    router.refresh();
  }

  if (!ready) {
    return (
      <AuthShell title="Reset password" description="Open the link from your email to set a new password.">
        <p className="rounded-xl border border-line bg-white p-3">
          Waiting for a valid reset link… If you just clicked the email link, this page should update in a moment.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" description="Choose a password for your Kitchen account.">
      <AuthError message={error ?? undefined} />
      <form onSubmit={handleSubmit} className="grid gap-4">
        <AuthField label="New password">
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={authInputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </AuthField>
        <AuthField label="Confirm password">
          <input
            type="password"
            name="confirm"
            required
            minLength={8}
            autoComplete="new-password"
            className={authInputClass}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </AuthField>
        <button
          type="submit"
          disabled={submitting}
          className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}
