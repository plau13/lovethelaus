import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/recipes", label: "Recipes" },
  { href: "/cookbooks", label: "Cookbooks" },
  { href: "/loved-ones", label: "Loved Ones" },
] as const;

export function AppHeader({ userName }: { userName: string | null }) {
  return (
    <header className="border-b border-line bg-paper/90 no-print">
      <div className="mx-auto max-w-4xl px-4 py-3">
        {userName ? (
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <Link href="/" className="justify-self-start font-serif text-2xl text-ink no-underline">
              Kitchen
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-base sm:justify-self-center">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="justify-self-center sm:justify-self-end">
              <UserMenu userName={userName} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="font-serif text-2xl text-ink no-underline">
              Kitchen
            </Link>
            <Link href="/sign-in" className="text-lg">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
