"use client";

import Link from "next/link";
import { useEffect } from "react";
import { captureBoundaryError } from "@/lib/sentry-boundary";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureBoundaryError(error, "public.error_boundary");
  }, [error]);

  return (
    <main className="mx-auto grid max-w-md gap-4 py-16">
      <h1 className="font-serif text-3xl">Something went wrong</h1>
      <p className="text-muted leading-relaxed">This page could not load. Try again or explore public recipes.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
          Try again
        </button>
        <Link href="/explore" className="btn rounded-xl border border-line bg-white px-5 py-3 text-clay no-underline hover:border-clay">
          Explore recipes
        </Link>
      </div>
    </main>
  );
}
