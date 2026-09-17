import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const message = error === "INVALID_TOKEN" ? "That link is invalid or expired. Request a new one." : error;
  return <ResetPasswordForm token={token?.trim() || null} error={message} />;
}
