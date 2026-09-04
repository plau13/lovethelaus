"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/recipes";

const iconButtonClass =
  "inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-line bg-white text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50";

function BackArrowIcon() {
  return (
    <svg aria-hidden className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path
        d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

export function RecipeDetailToolbar({
  recipeId,
  favorited: initialFavorited,
  canExport,
  canEdit,
  exportHref,
}: {
  recipeId: string;
  favorited: boolean;
  canExport: boolean;
  canEdit: boolean;
  exportHref: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
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
    <div className="no-print flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted m-0 flex flex-wrap items-center gap-1">
        <Link href="/recipes" className="inline-flex items-center gap-1 no-underline hover:text-ink">
          <BackArrowIcon />
          <span>All recipes</span>
        </Link>
        <span aria-hidden>·</span>
        <Link href={`/recipes/${recipeId}/cook`} className="no-underline hover:text-ink">
          Cook mode
        </Link>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleFavoriteToggle}
          disabled={pending}
          className={`${iconButtonClass} ${favorited ? "text-clay" : "text-muted"}`}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorited}
        >
          <HeartIcon filled={favorited} />
        </button>

        {canExport ? (
          <a
            href={exportHref}
            className={`${iconButtonClass} no-underline`}
            aria-label="Download recipe"
            download
          >
            <DownloadIcon />
          </a>
        ) : (
          <span className="relative group">
            <button
              type="button"
              disabled
              aria-disabled
              className={iconButtonClass}
              aria-label="Download recipe unavailable"
              title="Subscribe in Settings to download shared recipes"
            >
              <DownloadIcon />
            </button>
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

        {canEdit ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className={iconButtonClass}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Recipe actions"
            >
              <MoreIcon />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 min-w-36 rounded-xl border border-line bg-white py-1 shadow-lg"
              >
                <Link
                  href={`/recipes/${recipeId}/edit`}
                  role="menuitem"
                  className="block px-4 py-2 no-underline hover:bg-paper"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
