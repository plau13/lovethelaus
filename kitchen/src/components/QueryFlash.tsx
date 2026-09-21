import { FormAlert, FormNotice } from "@/components/FormAlert";

type QueryFlashProps = {
  error?: string | null;
  saved?: string | null;
  sent?: string | null;
  checkout?: string | null;
  reset?: string | null;
  made?: string | null;
  invite?: string | null;
};

const SENT_MESSAGES: Record<string, string> = {
  "1": "Check your email for the next step.",
  "magic-link": "Check your email for a one-time sign-in link.",
};

export function QueryFlash({
  error,
  saved,
  sent,
  checkout,
  reset,
  made,
  invite,
}: QueryFlashProps) {
  return (
    <>
      <FormAlert message={error} />
      {saved ? <FormNotice message="Saved." /> : null}
      {sent ? <FormNotice message={SENT_MESSAGES[sent] ?? "Check your email."} /> : null}
      {checkout === "success" ? <FormNotice message="Payment received — your plan will update shortly." /> : null}
      {reset === "1" ? <FormNotice message="Password updated. Sign in with your new password." /> : null}
      {made === "1" ? <FormNotice message="Marked as made — nice work." /> : null}
      {invite ? <FormNotice message="Invite sent." /> : null}
    </>
  );
}
