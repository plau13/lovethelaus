import type { ReactNode } from "react";
import { AdSlot } from "@/components/ads/AdSlot";

/**
 * Two-column public layout: content column (same width as the app) plus a desktop ad rail.
 * Pass `ads={false}` on pages that must not carry ads (unlisted cookbooks, no-index pages).
 */
export function PublicShell({ children, ads = true }: { children: ReactNode; ads?: boolean }) {
  return (
    <div className={ads ? "lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10" : ""}>
      <div className="mx-auto w-full max-w-3xl lg:mx-0">{children}</div>
      {ads ? (
        <aside className="hidden lg:block" aria-label="Sponsored">
          <div className="sticky top-6 grid gap-6">
            <AdSlot size="rail" />
            <AdSlot size="rect" />
          </div>
        </aside>
      ) : null}
    </div>
  );
}
