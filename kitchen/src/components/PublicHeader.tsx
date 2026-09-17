import Link from "next/link";

/** Header for the public pages: no session lookup, so it can be cached. */
export function PublicHeader() {
  return (
    <header className="border-b border-line bg-paper/90 no-print">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-serif text-2xl text-ink no-underline">
          Kitchen
        </Link>
        <nav className="flex items-center gap-4 text-base">
          <Link href="/explore">Explore</Link>
          <Link
            href="/sign-in"
            className="btn-clay btn-clay-hover inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-base no-underline"
          >
            Open Kitchen
          </Link>
        </nav>
      </div>
    </header>
  );
}
