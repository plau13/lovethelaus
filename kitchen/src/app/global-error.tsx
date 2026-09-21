"use client";

import { useEffect } from "react";
import { captureBoundaryError } from "@/lib/sentry-boundary";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureBoundaryError(error, "global.error_boundary");
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-paper p-8 font-sans text-ink antialiased">
        <main className="mx-auto grid max-w-md gap-4">
          <h1 className="font-serif text-3xl">Something went wrong</h1>
          <p className="text-muted">The app hit an unexpected error.</p>
          <button type="button" onClick={reset} className="w-fit rounded-xl bg-clay px-5 py-3 text-white">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
