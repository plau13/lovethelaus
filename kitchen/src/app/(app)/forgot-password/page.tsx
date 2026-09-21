import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { AuthShell } from "@/components/AuthShell";

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
      <ForgotPasswordForm error={error} sent={sent === "1"} />
    </AuthShell>
  );
}
