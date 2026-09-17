import Link from "next/link";
import { recipeListMeta } from "@/components/RecipeListItem";
import { photoUrl, publicRecipePath } from "@/lib/paths";

export type PublicRecipeCardProps = {
  id: string;
  slug: string | null;
  title: string;
  category: string | null;
  cookMinutes: number | null;
  difficulty: string | null;
  tags: string;
  photoKey: string | null;
  ownerName?: string | null;
};

export function PublicRecipeCard({ id, slug, title, category, cookMinutes, difficulty, tags, photoKey, ownerName }: PublicRecipeCardProps) {
  const href = publicRecipePath({ id, slug });
  const meta = recipeListMeta({ category, cookMinutes, difficulty, tags });
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <Link href={href} className="grid text-ink no-underline">
        {photoKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(photoKey)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div aria-hidden="true" className="flex aspect-[4/3] w-full items-center justify-center bg-paper font-serif text-5xl text-line">
            ❦
          </div>
        )}
        <div className="grid gap-1 p-4">
          <h3 className="font-serif text-2xl leading-tight">{title}</h3>
          <p className="text-sm text-muted">{meta || (ownerName ? `From ${ownerName}` : "Family recipe")}</p>
        </div>
      </Link>
    </li>
  );
}
