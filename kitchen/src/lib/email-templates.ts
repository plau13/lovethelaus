import { sendEmail, type EmailMessage } from "@/lib/email";

const PAPER = "#faf6f0";
const INK = "#2c1810";
const MUTED = "#6b5348";
const CLAY = "#8b3a2a";
const LINE = "#e6d8cc";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(args: { heading: string; intro: string; cta: string; url: string; footer: string }): string {
  const { heading, intro, cta, url, footer } = args;
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:${PAPER};font-family:'Source Sans 3',Helvetica,Arial,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border:1px solid ${LINE};border-radius:16px;">
    <tr><td style="padding:32px 28px;">
      <p style="margin:0 0 8px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};">Kitchen</p>
      <h1 style="margin:0 0 16px;font-family:'Source Serif 4',Georgia,serif;font-size:26px;font-weight:600;color:${INK};">${heading}</h1>
      <p style="margin:0 0 24px;font-size:17px;line-height:1.5;">${intro}</p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(url)}" style="display:inline-block;background:${CLAY};color:#fff;text-decoration:none;font-size:17px;padding:14px 22px;border-radius:12px;">${escapeHtml(cta)}</a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:${MUTED};line-height:1.5;">If the button does not work, copy this link:<br><a href="${escapeHtml(url)}" style="color:${CLAY};word-break:break-all;">${escapeHtml(url)}</a></p>
      <p style="margin:16px 0 0;font-size:14px;color:${MUTED};line-height:1.5;">${footer}</p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function magicLinkEmail(to: string, url: string): EmailMessage {
  return {
    to,
    subject: "Your one-time sign-in link for Kitchen",
    html: layout({
      heading: "Sign in to Kitchen",
      intro: "Tap the button to sign in. The link works once and expires in 15 minutes.",
      cta: "Sign in",
      url,
      footer: "If you did not ask for this link, you can ignore this email.",
    }),
    text: `Sign in to Kitchen with this one-time link (expires in 15 minutes):\n\n${url}\n\nIf you did not ask for this link, ignore this email.`,
  };
}

export function passwordResetEmail(to: string, url: string): EmailMessage {
  return {
    to,
    subject: "Reset your Kitchen password",
    html: layout({
      heading: "Set a new password",
      intro: "Tap the button to choose a new password. The link expires in one hour.",
      cta: "Reset password",
      url,
      footer: "If you did not ask to reset your password, you can ignore this email and your password stays the same.",
    }),
    text: `Set a new Kitchen password with this link (expires in one hour):\n\n${url}\n\nIf you did not ask for this, ignore this email.`,
  };
}

export function cookbookInviteEmail(args: {
  to: string;
  inviterName: string;
  cookbookTitle: string;
  role: string;
  url: string;
}): EmailMessage {
  const { to, inviterName, cookbookTitle, role, url } = args;
  const roleLabel = role === "editor" ? "add and edit recipes" : "read the recipes";
  return {
    to,
    subject: `${inviterName} shared the cookbook “${cookbookTitle}” with you`,
    html: layout({
      heading: `${escapeHtml(inviterName)} invited you to “${escapeHtml(cookbookTitle)}”`,
      intro: `You can ${roleLabel} in this family cookbook on Kitchen. Create a free account with this email address to join. The invite is good for 14 days.`,
      cta: "Open the invitation",
      url,
      footer: "Kitchen is a private family recipe box. Nothing is shared unless the cookbook owner shares it.",
    }),
    text: `${inviterName} invited you to the cookbook "${cookbookTitle}" on Kitchen (you can ${roleLabel}).\n\nOpen the invitation (good for 14 days):\n${url}\n`,
  };
}

export function cookbookMemberAddedEmail(args: {
  to: string;
  inviterName: string;
  cookbookTitle: string;
  role: string;
  url: string;
}): EmailMessage {
  const { to, inviterName, cookbookTitle, role, url } = args;
  const roleLabel = role === "editor" ? "add and edit recipes" : "read the recipes";
  return {
    to,
    subject: `${inviterName} added you to “${cookbookTitle}”`,
    html: layout({
      heading: `You are in “${escapeHtml(cookbookTitle)}”`,
      intro: `${escapeHtml(inviterName)} added you to this cookbook on Kitchen. You can ${roleLabel}.`,
      cta: "Open the cookbook",
      url,
      footer: "Sign in with your Kitchen account to see it.",
    }),
    text: `${inviterName} added you to the cookbook "${cookbookTitle}" on Kitchen (you can ${roleLabel}).\n\n${url}\n`,
  };
}

export function recipeCollaboratorEmail(args: {
  to: string;
  inviterName: string;
  recipeTitle: string;
  role: string;
  url: string;
}): EmailMessage {
  const { to, inviterName, recipeTitle, role, url } = args;
  return {
    to,
    subject: `${inviterName} shared the recipe “${recipeTitle}” with you`,
    html: layout({
      heading: `“${escapeHtml(recipeTitle)}” was shared with you`,
      intro: `${escapeHtml(inviterName)} gave you ${escapeHtml(role)} access to this recipe on Kitchen.`,
      cta: "Open the recipe",
      url,
      footer: "Sign in with your Kitchen account to see it.",
    }),
    text: `${inviterName} gave you ${role} access to the recipe "${recipeTitle}" on Kitchen.\n\n${url}\n`,
  };
}

export const sendMagicLinkEmail = (to: string, url: string) => sendEmail(magicLinkEmail(to, url));
export const sendPasswordResetEmail = (to: string, url: string) => sendEmail(passwordResetEmail(to, url));
export const sendCookbookInviteEmail = (args: Parameters<typeof cookbookInviteEmail>[0]) =>
  sendEmail(cookbookInviteEmail(args));
export const sendCookbookMemberAddedEmail = (args: Parameters<typeof cookbookMemberAddedEmail>[0]) =>
  sendEmail(cookbookMemberAddedEmail(args));
export const sendRecipeCollaboratorEmail = (args: Parameters<typeof recipeCollaboratorEmail>[0]) =>
  sendEmail(recipeCollaboratorEmail(args));
