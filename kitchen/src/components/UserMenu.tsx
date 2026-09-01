"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logOut } from "@/app/actions/auth";

export function UserMenu({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-line/40"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{userName}</span>
        <span className="text-muted" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-40 rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          <Link
            href="/settings"
            role="menuitem"
            className="block px-4 py-2 no-underline hover:bg-paper"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <form action={logOut} className="border-t border-line">
            <button type="submit" role="menuitem" className="w-full px-4 py-2 text-left text-clay hover:bg-paper">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
