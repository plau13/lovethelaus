import { coverPhoto } from "@/lib/cover-photo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { PublicRecipeCard } from "@/components/PublicRecipeCard";
import { PublicShell } from "@/components/PublicShell";
import { getPublicCookbook } from "@/lib/cookbooks";
import { publicCookbookUrl, publicRecipeUrl } from "@/lib/paths";
import { itemListJsonLd } from "@/lib/public-seo";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cookbook = await getPublicCookbook(slug);
  if (!cookbook) {
    return { title: "Cookbook not found" };
  }
  const indexable = cookbook.visibility === "public";
  const description = cookbook.description?.trim() || `${cookbook.recipes.length} family recipes from ${cookbook.owner.name}.`;
  return {
    title: `${cookbook.title} · Kitchen`,
    description,
    alternates: { canonical: publicCookbookUrl(cookbook) },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", title: cookbook.title, description, url: publicCookbookUrl(cookbook), siteName: "Kitchen" },
  };
}

export default async function PublicCookbookPage({ params }: Params) {
  const { slug } = await params;
  const cookbook = await getPublicCookbook(slug);
  if (!cookbook) {
    notFound();
  }
  const indexable = cookbook.visibility === "public";
  const recipes = cookbook.recipes.map((entry) => entry.recipe);
  const jsonLd = itemListJsonLd(
    cookbook.title,
    recipes.map((recipe) => publicRecipeUrl(recipe))
  );

  return (
    <PublicShell ads={indexable}>
      <main className="grid gap-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/explore">Explore</Link>
        </nav>
        <div className="grid gap-2">
          <h1 className="font-serif text-4xl leading-tight">{cookbook.title}</h1>
          <p className="text-muted">
            A cookbook from {cookbook.familyName ? `the ${cookbook.familyName} family` : cookbook.owner.name} ·{" "}
            {recipes.length} recipe{recipes.length === 1 ? "" : "s"}
          </p>
          {cookbook.description ? <p className="text-lg">{cookbook.description}</p> : null}
          {cookbook.dedication ? <p className="font-serif text-lg italic text-muted">{cookbook.dedication}</p> : null}
        </div>

        {recipes.length === 0 ? (
          <p className="text-muted">No recipes in this cookbook yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <PublicRecipeCard
                key={recipe.id}
                id={recipe.id}
                slug={recipe.slug}
                title={recipe.title}
                category={recipe.category}
                cookMinutes={recipe.cookMinutes}
                difficulty={recipe.difficulty}
                tags={recipe.tags}
                photoKey={coverPhoto(recipe)?.path ?? null}
                ownerName={cookbook.owner.name}
              />
            ))}
          </ul>
        )}
        {indexable ? <AdSlot size="anchor" /> : null}
      </main>
    </PublicShell>
  );
}
