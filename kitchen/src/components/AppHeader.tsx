import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";

export function AppHeader({ userName }: { userName: string | null }) {
  return (
    <header className="border-b border-line bg-paper/90 no-print">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={userName ? "/" : "/"} className="font-serif text-2xl text-ink">
          Kitchen
        </Link>
        {userName ? (
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
            <Link href="/">Home</Link>
            <Link href="/recipes">Recipes</Link>
            <Link href="/cookbooks">Cookbooks</Link>
            <UserMenu userName={userName} />
          </nav>
        ) : (
          <Link href="/sign-in" className="text-lg">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
