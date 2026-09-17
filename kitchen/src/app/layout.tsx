import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { BASE_PATH } from "@/lib/paths";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Kitchen — family recipes",
  description: "A private recipe box for the family.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: `${BASE_PATH}/icon.svg`,
    apple: `${BASE_PATH}/icon.svg`,
  },
  appleWebApp: {
    capable: true,
    title: "Kitchen",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#faf6f0",
};

/**
 * Root shell only: fonts, global styles, service worker. The signed-in app lives under the
 * `(app)` route group (header + narrow column, reads the session) and the crawlable pages under
 * `(public)` (wide layout with ad rail, never reads the session).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
