"use client";

import { useState, type KeyboardEvent } from "react";
import { isValidEmail } from "@/lib/parse-emails";

type EmailPillInputProps = {
  name: string;
  defaultEmails?: string[];
  placeholder?: string;
};

export function EmailPillInput({
  name,
  defaultEmails = [],
  placeholder = "family@example.com",
}: EmailPillInputProps) {
  const [emails, setEmails] = useState<string[]>(defaultEmails);
  const [draft, setDraft] = useState("");

  function addEmail(raw: string) {
    const email = raw.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return;
    }
    setEmails((current) => (current.includes(email) ? current : [...current, email]));
    setDraft("");
  }

  function removeEmail(email: string) {
    setEmails((current) => current.filter((entry) => entry !== email));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addEmail(draft);
    } else if (event.key === "Backspace" && !draft && emails.length > 0) {
      setEmails((current) => current.slice(0, -1));
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
        {emails.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-sm"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(email)}
              className="text-muted hover:text-ink"
              aria-label={`Remove ${email}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              addEmail(draft);
            }
          }}
          placeholder={emails.length === 0 ? placeholder : "Add another email"}
          className="min-w-[12rem] flex-1 border-0 bg-transparent px-1 py-1 outline-none"
        />
      </div>
      <input type="hidden" name={name} value={JSON.stringify(emails)} />
    </div>
  );
}
