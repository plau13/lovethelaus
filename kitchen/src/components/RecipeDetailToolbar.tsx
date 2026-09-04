"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/recipes";
import { IconButton, IconLink } from "@/components/IconButton";
import { RecipeShareDialog } from "@/components/RecipeShareDialog";

function BackArrowIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path
        d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

type Collaborator = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

export function RecipeDetailToolbar({
  recipeId,
  favorited: initialFavorited,
  canExport,
  canEdit,
  canInvite,
  isOwner,
  collaborators,
  exportHref,
  cookModeOn,
  onCookModeChange,
}: {
  recipeId: string;
  favorited: boolean;
  canExport: boolean;
  canEdit: boolean;
  canInvite: boolean;
  isOwner: boolean;
  collaborators: Collaborator[];
  exportHref: string;
  cookModeOn: boolean;
  onCookModeChange: (on: boolean) => void;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function handleFavoriteToggle() {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("recipeId", recipeId);
      try {
        await toggleFavorite(formData);
      } catch {
        setFavorited(!next);
      }
    });
  }

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted flex flex-nowrap items-center gap-2">
          <Link href="/recipes" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap no-underline hover:text-ink">
            <BackArrowIcon />
            <span>All recipes</span>
          </Link>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => onCookModeChange(!cookModeOn)}
            className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium ${
              cookModeOn
                ? "border-green-700 bg-green-700 text-white"
                : "border-line bg-line/40 text-muted"
            }`}
            aria-pressed={cookModeOn}
          >
            <span>Cook mode</span>
            <span>{cookModeOn ? "On" : "Off"}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            onClick={handleFavoriteToggle}
            disabled={pending}
            className={favorited ? "text-clay" : "text-muted"}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorited}
          >
            <HeartIcon filled={favorited} />
          </IconButton>

          <IconButton onClick={() => setShareOpen(true)} aria-label="Share recipe">
            <ShareIcon />
          </IconButton>

          {canExport ? (
            <IconLink href={exportHref} aria-label="Download recipe" download>
              <DownloadIcon />
            </IconLink>
          ) : (
            <span className="group relative">
              <IconButton
                disabled
                aria-disabled
                aria-label="Download recipe unavailable"
                title="Subscribe in Settings to download shared recipes"
              >
                <DownloadIcon />
              </IconButton>
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-56 rounded-xl border border-line bg-white p-3 text-sm text-muted shadow-lg group-hover:block group-focus-within:block"
              >
                Subscribe in{" "}
                <Link href="/settings" className="text-clay">
                  Settings
                </Link>{" "}
                to download shared recipes.
              </span>
            </span>
          )}

          <div className="relative" ref={menuRef}>
            <IconButton
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Recipe actions"
            >
              <MoreIcon />
            </IconButton>
            {menuOpen && canEdit ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 min-w-36 rounded-xl border border-line bg-white py-1 shadow-lg"
              >
                <Link
                  href={`/recipes/${recipeId}/edit`}
                  role="menuitem"
                  className="block px-4 py-2 text-ink no-underline hover:bg-paper"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <RecipeShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        recipeId={recipeId}
        canInvite={canInvite}
        isOwner={isOwner}
        collaborators={collaborators}
      />
    </>
  );
}
