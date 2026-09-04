import Link from "next/link";
import { parseTags } from "@/lib/tags";
import { categoryLabel, difficultyLabel, formatCookMinutes } from "@/lib/types";

export type RecipeListItemProps = {
  id: string;
  title: string;
  category: string | null;
  cookMinutes: number | null;
  difficulty: string | null;
  tags: string;
};

export function recipeListMeta({
  category,
  cookMinutes,
  difficulty,
  tags,
}: Pick<RecipeListItemProps, "category" | "cookMinutes" | "difficulty" | "tags">): string {
  const tagLine = parseTags(tags).join(" · ");
  return [
    category ? categoryLabel(category) : null,
    formatCookMinutes(cookMinutes) || null,
    difficulty ? difficultyLabel(difficulty) : null,
    tagLine || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function RecipeListItem({
  id,
  title,
  category,
  cookMinutes,
  difficulty,
  tags,
}: RecipeListItemProps) {
  const meta = recipeListMeta({ category, cookMinutes, difficulty, tags });

  return (
    <li className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <Link href={`/recipes/${id}`} className="font-serif text-2xl text-ink no-underline">
        {title}
      </Link>
      <p className="mt-1 text-muted">{meta || "Untagged"}</p>
    </li>
  );
}
