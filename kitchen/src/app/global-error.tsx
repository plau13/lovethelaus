"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("event", "global.error_boundary");
      Sentry.captureException(error);
    });
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
