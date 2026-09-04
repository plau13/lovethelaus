import Link from "next/link";
import type { ReactNode } from "react";
import { categoryLabel, difficultyLabel, formatCookMinutes } from "@/lib/types";

const TAB_COLORS = [
  "bg-[#f5e6c8] border-[#d4b896]",
  "bg-[#e8d4bc] border-[#c4a484]",
  "bg-[#f0dcc4] border-[#c9ad8c]",
] as const;

type RecipeTabCardProps = {
  id: string;
  title: string;
  category: string | null;
  cookMinutes: number | null;
  difficulty: string | null;
  index: number;
};

export function RecipeTabCard({
  id,
  title,
  category,
  cookMinutes,
  difficulty,
  index,
}: RecipeTabCardProps) {
  const colors = TAB_COLORS[index % TAB_COLORS.length];
  const meta = [
    category ? categoryLabel(category) : "Uncategorized",
    formatCookMinutes(cookMinutes) || null,
    difficulty ? difficultyLabel(difficulty) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="group relative pt-2">
      <Link
        href={`/recipes/${id}`}
        className={`relative z-10 inline-block max-w-full rounded-t-xl border px-4 py-2.5 font-serif text-lg text-ink no-underline shadow-sm ${colors}`}
        style={{
          transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg) translateY(0)`,
        }}
      >
        <span className="line-clamp-2">{title}</span>
      </Link>
      <div className="rounded-2xl rounded-tl-none border border-line bg-white p-4 shadow-sm">
        <p className="text-sm text-muted opacity-100 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          {meta}
        </p>
      </div>
    </li>
  );
}

export function RecipeCardGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
  );
}
