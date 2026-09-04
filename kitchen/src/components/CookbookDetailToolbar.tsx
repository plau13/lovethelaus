"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toggleFavorite } from "@/app/actions/cookbooks";
import { CookbookShareDialog } from "@/components/CookbookShareDialog";
import { IconButton, IconLink } from "@/components/IconButton";

function BackArrowIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
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

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

export function CookbookDetailToolbar({
  cookbookId,
  favorited: initialFavorited,
  canExport,
  canManage,
  isOwner,
  members,
  publicShareUrl,
  exportHref,
}: {
  cookbookId: string;
  favorited: boolean;
  canExport: boolean;
  canManage: boolean;
  isOwner: boolean;
  members: Member[];
  publicShareUrl: string | null;
  exportHref: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [cookbookId, initialFavorited]);

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
    const formData = new FormData();
    formData.set("cookbookId", cookbookId);
    void toggleFavorite(formData).catch(() => {
      setFavorited(!next);
    });
  }

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/cookbooks" className="text-muted inline-flex shrink-0 items-center gap-1 whitespace-nowrap no-underline hover:text-ink">
          <BackArrowIcon />
          <span>All cookbooks</span>
        </Link>

        <div className="flex items-center gap-1">
          <IconButton
            onClick={handleFavoriteToggle}
            className={favorited ? "text-clay" : "text-muted"}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorited}
          >
            <HeartIcon filled={favorited} />
          </IconButton>

          <IconButton onClick={() => setShareOpen(true)} aria-label="Share cookbook">
            <ShareIcon />
          </IconButton>

          {canExport ? (
            <IconLink href={exportHref} aria-label="Download cookbook" download>
              <DownloadIcon />
            </IconLink>
          ) : null}

          <div className="relative" ref={menuRef}>
            <IconButton
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Cookbook actions"
            >
              <MoreIcon />
            </IconButton>
            {menuOpen && canManage ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 min-w-36 rounded-xl border border-line bg-white py-1 shadow-lg"
              >
                <Link
                  href={`/cookbooks/${cookbookId}/settings`}
                  role="menuitem"
                  className="block px-4 py-2 text-ink no-underline hover:bg-paper"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit cookbook settings
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <CookbookShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        cookbookId={cookbookId}
        canManage={canManage}
        isOwner={isOwner}
        members={members}
        publicShareUrl={publicShareUrl}
      />
    </>
  );
}
