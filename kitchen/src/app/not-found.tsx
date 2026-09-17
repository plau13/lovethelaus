import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
      <main className="grid gap-3 py-10">
        <h1 className="font-serif text-4xl">Not found</h1>
        <p className="text-muted">That recipe or cookbook is missing, private, or the link expired.</p>
        <p>
          <Link href="/explore">Explore public recipes</Link> · <Link href="/">Home</Link>
        </p>
      </main>
    </div>
  );
}
