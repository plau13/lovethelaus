import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh antialiased">
        <AppHeader userName={user?.name ?? null} />
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">{children}</div>
      </body>
    </html>
  );
}
