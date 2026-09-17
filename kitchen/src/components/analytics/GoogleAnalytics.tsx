import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || null;

/** GA4 on public pages only; renders nothing until NEXT_PUBLIC_GA_ID is set at build time. */
export function GoogleAnalytics() {
  if (!GA_ID) {
    return null;
  }
  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
