import { Resend } from "resend";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Send a transactional email through Resend. With no RESEND_API_KEY (local dev) the
 * message is printed to the server console so links can be copied from the terminal.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(`[email:dev] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
    return;
  }
  const from = process.env.EMAIL_FROM?.trim() || "Kitchen <kitchen@lovethelaus.com>";
  const replyTo = process.env.SUPPORT_EMAIL?.trim();
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) {
    throw new Error(`Email failed: ${error.message}`);
  }
}
