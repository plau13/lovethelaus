import Link from "next/link";

const SPINE_COLORS = [
  "bg-[#8b3a2a] text-white",
  "bg-[#5a7a6e] text-white",
  "bg-[#c47864] text-white",
  "bg-[#6b5348] text-white",
  "bg-[#a65d4a] text-white",
] as const;

export type CookbookSpineItem = {
  id: string;
  title: string;
  recipeCount: number;
  visibility?: string;
};

export function CookbookSpineShelf({ cookbooks }: { cookbooks: CookbookSpineItem[] }) {
  if (cookbooks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-[inset_0_2px_8px_rgb(44_24_16/8%)]">
      <ul className="flex flex-wrap items-end gap-3">
        {cookbooks.map((cookbook, index) => {
          const colors = SPINE_COLORS[index % SPINE_COLORS.length];
          const rotation = index % 2 === 0 ? -2 : 2;
          return (
            <li key={cookbook.id}>
              <Link
                href={`/cookbooks/${cookbook.id}`}
                className={`group relative flex h-36 w-14 items-center justify-center rounded-sm border border-black/10 shadow-md no-underline transition-transform hover:-translate-y-1 ${colors}`}
                style={{ transform: `rotate(${rotation}deg)` }}
                title={`${cookbook.title} · ${cookbook.recipeCount} recipes`}
              >
                <span
                  className="max-h-32 overflow-hidden px-1 text-center font-serif text-sm leading-tight"
                  style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                >
                  {cookbook.title}
                </span>
                <span className="pointer-events-none absolute -bottom-7 left-1/2 w-24 -translate-x-1/2 text-center text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  {cookbook.recipeCount} recipes
                  {cookbook.visibility ? ` · ${cookbook.visibility}` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
