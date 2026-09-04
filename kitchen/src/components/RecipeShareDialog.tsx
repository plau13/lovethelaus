"use client";

import { grantRecipeAccess, revokeRecipeAccess } from "@/app/actions/collaborators";
import { useEffect, useRef, useState } from "react";
import { collabRoleLabel, RECIPE_COLLAB_ROLES } from "@/lib/types";

type Collaborator = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

export function RecipeShareDialog({
  open,
  onClose,
  recipeId,
  canInvite,
  isOwner,
  collaborators,
}: {
  open: boolean;
  onClose: () => void;
  recipeId: string;
  canInvite: boolean;
  isOwner: boolean;
  collaborators: Collaborator[];
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

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
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="share-recipe-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="share-recipe-title" className="text-xl font-semibold">
            Share recipe
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="btn-clay btn-clay-hover mb-5 w-full rounded-xl px-4 py-2"
        >
          {copied ? "Link copied" : "Copy recipe link"}
        </button>

        {canInvite ? (
          <div className="grid gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">
              Invite family to view, comment, edit, or co-author this recipe.
            </p>
            {collaborators.length > 0 ? (
              <ul className="grid gap-2 text-sm">
                {collaborators.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
                  >
                    <span>
                      {entry.user.name} ({entry.user.email}) — {collabRoleLabel(entry.role)}
                    </span>
                    {isOwner ? (
                      <form action={revokeRecipeAccess}>
                        <input type="hidden" name="recipeId" value={recipeId} />
                        <input type="hidden" name="collaboratorUserId" value={entry.userId} />
                        <button type="submit" className="text-clay">
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <form action={grantRecipeAccess} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input type="hidden" name="recipeId" value={recipeId} />
              <input
                name="email"
                type="email"
                required
                placeholder="family@example.com"
                className="rounded-xl border border-line bg-white px-3 py-2"
              />
              <select name="role" className="rounded-xl border border-line bg-white px-3 py-2" defaultValue="view">
                {RECIPE_COLLAB_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {collabRoleLabel(role)}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-clay btn-clay-hover rounded-xl px-4 py-2">
                Invite
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
