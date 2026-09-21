"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("event", "app.error_boundary");
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <main className="mx-auto grid max-w-md gap-4 py-16">
      <h1 className="font-serif text-3xl">Something went wrong</h1>
      <p className="text-muted leading-relaxed">
        An unexpected error occurred. You can try again, or head back to your recipes.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
          Try again
        </button>
        <Link href="/recipes" className="btn rounded-xl border border-line bg-white px-5 py-3 text-clay no-underline hover:border-clay">
          Go to recipes
        </Link>
      </div>
    </main>
  );
}
