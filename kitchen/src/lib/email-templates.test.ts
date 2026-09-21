import { describe, expect, it } from "vitest";
import { cookbookInviteEmail, escapeHtml, magicLinkEmail, passwordResetEmail, recipeCollaboratorEmail } from "./email-templates";

const magicLinkUrl =
  "https://lovethelaus.com/kitchen/api/auth/magic-link/verify?token=abc&callbackURL=%2Fkitchen%2Fauth%2Fcallback";
const resetUrl = "https://lovethelaus.com/kitchen/reset-password?token=abc";

describe("email templates", () => {
  it("include the link in both html and text", () => {
    for (const [message, url] of [
      [magicLinkEmail("a@b.co", magicLinkUrl), magicLinkUrl],
      [passwordResetEmail("a@b.co", resetUrl), resetUrl],
    ] as const) {
      expect(message.to).toBe("a@b.co");
      expect(message.html).toContain(escapeHtml(url));
      expect(message.text).toContain(url);
    }
  });

  it("escape user-provided names and titles", () => {
    const message = cookbookInviteEmail({
      to: "x@y.z",
      inviterName: "<script>alert(1)</script>",
      cookbookTitle: "Rose & Co",
      role: "editor",
      url: "https://lovethelaus.com/kitchen/invite/t",
    });
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.html).toContain("Rose &amp; Co");
    expect(message.text).toContain("Rose & Co");
    expect(message.html).toContain("add and edit recipes");
  });

  it("describe collaborator access", () => {
    const message = recipeCollaboratorEmail({ to: "x@y.z", inviterName: "Mom", recipeTitle: "Pie", role: "co-author", url: "https://x/y" });
    expect(message.subject).toContain("Pie");
    expect(message.text).toContain("co-author");
  });
});
