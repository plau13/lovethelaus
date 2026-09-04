import Link from "next/link";
import { categoryLabel, difficultyLabel, formatCookMinutes } from "@/lib/types";

const TAB_COLORS = [
  "bg-[#f5e6c8] border-[#d4b896]",
  "bg-[#e8d4bc] border-[#c4a484]",
  "bg-[#f0dcc4] border-[#c9ad8c]",
] as const;

export type RecipeTabItem = {
  id: string;
  title: string;
  category: string | null;
  cookMinutes: number | null;
  difficulty: string | null;
};

export function RecipeTabCard({
  id,
  title,
  category,
  cookMinutes,
  difficulty,
  index,
}: RecipeTabItem & { index: number }) {
  const colors = TAB_COLORS[index % TAB_COLORS.length];
  const rotationClass = index % 2 === 0 ? "-rotate-[1.5deg]" : "rotate-[1.5deg]";
  const meta = [
    category ? categoryLabel(category) : "Uncategorized",
    formatCookMinutes(cookMinutes) || null,
    difficulty ? difficultyLabel(difficulty) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="group relative max-w-[14rem] pb-1">
      <Link
        href={`/recipes/${id}`}
        className={`relative z-20 inline-block rounded-t-xl border px-3 py-2 font-serif text-base text-ink no-underline shadow-sm transition-transform duration-200 ${rotationClass} ${colors} [@media(hover:hover)]:group-hover:-translate-y-2 [@media(hover:hover)]:group-hover:z-30 [@media(hover:hover)]:group-focus-within:-translate-y-2 [@media(hover:hover)]:group-focus-within:z-30`}
      >
        <span className="line-clamp-2">{title}</span>
      </Link>
      <div
        className={`relative z-10 -mt-px rounded-b-xl rounded-tr-xl border border-line border-t-0 bg-white px-3 py-2 shadow-sm transition-all duration-200 [@media(hover:hover)]:max-h-0 [@media(hover:hover)]:overflow-hidden [@media(hover:hover)]:border-transparent [@media(hover:hover)]:py-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:max-h-24 [@media(hover:hover)]:group-hover:overflow-visible [@media(hover:hover)]:group-hover:border-line [@media(hover:hover)]:group-hover:py-2 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:max-h-24 [@media(hover:hover)]:group-focus-within:overflow-visible [@media(hover:hover)]:group-focus-within:border-line [@media(hover:hover)]:group-focus-within:py-2 [@media(hover:hover)]:group-focus-within:opacity-100`}
      >
        <p className="text-xs text-muted">{meta}</p>
      </div>
    </li>
  );
}
