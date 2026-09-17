import Script from "next/script";
import { ADSENSE_CLIENT } from "@/components/ads/config";

/** Loads the AdSense library once per public page. Google's own CMP (Privacy & messaging) handles consent. */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) {
    return null;
  }
  return (
    <Script
      id="adsbygoogle-js"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`}
      crossOrigin="anonymous"
    />
  );
}
