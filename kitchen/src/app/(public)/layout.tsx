import type { ReactNode } from "react";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { PublicHeader } from "@/components/PublicHeader";

/**
 * Layout for crawlable, logged-out pages (/explore, /c/[slug], /r/[slug]).
 * Never reads the session, so pages here can be cached at the edge. Ads and analytics
 * load only on these routes and only when their env vars are set (see docs/ADS.md).
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdSenseScript />
      <GoogleAnalytics />
      <PublicHeader />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">{children}</div>
    </>
  );
}
