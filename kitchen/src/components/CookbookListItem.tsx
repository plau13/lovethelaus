import Link from "next/link";

export type CookbookListItemProps = {
  id: string;
  title: string;
  recipeCount: number;
  visibility?: string;
  role?: string | null;
};

export function cookbookListMeta({
  recipeCount,
  visibility,
  role,
}: Pick<CookbookListItemProps, "recipeCount" | "visibility" | "role">): string {
  return [
    visibility || null,
    `${recipeCount} recipe${recipeCount === 1 ? "" : "s"}`,
    role || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function CookbookListItem({ id, title, recipeCount, visibility, role }: CookbookListItemProps) {
  return (
    <li className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <Link href={`/cookbooks/${id}`} className="font-serif text-2xl text-ink no-underline">
        {title}
      </Link>
      <p className="mt-1 text-muted">{cookbookListMeta({ recipeCount, visibility, role })}</p>
    </li>
  );
}
