"use client";

import { useEffect, useRef, useState } from "react";
import {
  createCookbookInviteLink,
  grantCookbookAccessBatch,
  revokeCookbookAccess,
} from "@/app/actions/cookbooks";
import { EmailPillInput } from "@/components/EmailPillInput";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

function cookbookRoleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}

export function CookbookShareDialog({
  open,
  onClose,
  cookbookId,
  canManage,
  isOwner,
  members,
  publicShareUrl,
}: {
  open: boolean;
  onClose: () => void;
  cookbookId: string;
  canManage: boolean;
  isOwner: boolean;
  members: Member[];
  publicShareUrl: string | null;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setInviteCopied(false);
      setInviteUrl(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function copyPageLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function createInviteLink() {
    setPendingInvite(true);
    try {
      const url = await createCookbookInviteLink(cookbookId, "viewer");
      setInviteUrl(url);
    } finally {
      setPendingInvite(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
    } catch {
      setInviteCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="share-cookbook-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="share-cookbook-title" className="text-xl font-semibold">
            Share cookbook
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <button
          type="button"
          onClick={copyPageLink}
          className="btn-clay btn-clay-hover mb-3 w-full rounded-xl px-4 py-2"
        >
          {copied ? "Link copied" : "Copy cookbook page link"}
        </button>

        {publicShareUrl ? (
          <p className="mb-4 text-sm text-muted">
            Public link:{" "}
            <a href={publicShareUrl} className="break-all text-clay">
              {publicShareUrl}
            </a>
          </p>
        ) : null}

        {canManage ? (
          <div className="mb-5 grid gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">Create an invite link anyone can use to join this cookbook.</p>
            <button
              type="button"
              onClick={createInviteLink}
              disabled={pendingInvite}
              className="btn w-fit rounded-xl border border-line px-4 py-2"
            >
              {pendingInvite ? "Creating…" : "Create invite link"}
            </button>
            {inviteUrl ? (
              <div className="grid gap-2">
                <p className="break-all text-sm">{inviteUrl}</p>
                <button type="button" onClick={copyInviteLink} className="btn-clay btn-clay-hover w-fit rounded-xl px-4 py-2">
                  {inviteCopied ? "Invite link copied" : "Copy invite link"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {canManage ? (
          <div className="grid gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">Invite family by email. They need a Kitchen account first.</p>
            {members.length > 0 ? (
              <ul className="grid gap-2 text-sm">
                {members.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
                  >
                    <span>
                      {entry.user.name} ({entry.user.email}) — {cookbookRoleLabel(entry.role)}
                    </span>
                    {isOwner && entry.role !== "owner" ? (
                      <form action={revokeCookbookAccess}>
                        <input type="hidden" name="cookbookId" value={cookbookId} />
                        <input type="hidden" name="memberUserId" value={entry.userId} />
                        <button type="submit" className="text-clay">
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <form action={grantCookbookAccessBatch} className="grid gap-3">
              <input type="hidden" name="cookbookId" value={cookbookId} />
              <EmailPillInput name="emails" />
              <label className="grid gap-1">
                <span className="text-sm font-medium">Role</span>
                <select name="role" defaultValue="viewer" className="rounded-xl border border-line bg-white px-3 py-2">
                  <option value="viewer">Viewer — cook and leave notes</option>
                  <option value="editor">Editor — add their own recipes</option>
                </select>
              </label>
              <button type="submit" className="btn-clay btn-clay-hover rounded-xl px-4 py-2">
                Send invites
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
