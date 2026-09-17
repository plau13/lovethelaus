import { coverPhoto } from "@/lib/cover-photo";
import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { PublicRecipeCard } from "@/components/PublicRecipeCard";
import { PublicShell } from "@/components/PublicShell";
import { appUrl, publicCookbookPath, publicRecipeUrl } from "@/lib/paths";
import { EXPLORE_PAGE_SIZE, listPublicCookbooks, listPublicRecipes } from "@/lib/public-recipes";
import { paginate } from "@/lib/pagination";
import { itemListJsonLd } from "@/lib/public-seo";
import { RECIPE_CATEGORIES, categoryLabel, type RecipeCategory } from "@/lib/types";

export function exploreBasePath(category?: RecipeCategory): string {
  return category ? `/explore/${category}` : "/explore";
}

export function exploreMetadata(category: RecipeCategory | undefined, page: number): Metadata {
  const label = category ? categoryLabel(category) : "Family recipes";
  const title = page > 1 ? `${label} · page ${page} · Kitchen` : `${label} · Kitchen`;
  const description = category
    ? `${categoryLabel(category)} recipes families have shared on Kitchen.`
    : "Recipes families have chosen to share from their Kitchen recipe boxes.";
  const base = exploreBasePath(category);
  return {
    title,
    description,
    alternates: { canonical: appUrl(page > 1 ? `${base}?page=${page}` : base) },
    robots: { index: true, follow: true },
    openGraph: { type: "website", title, description, url: appUrl(base), siteName: "Kitchen" },
  };
}

export async function ExploreView({ category, pageParam }: { category?: RecipeCategory; pageParam?: string }) {
  const probe = await listPublicRecipes({ category, offset: 0, limit: 1 });
  const pagination = paginate(pageParam, EXPLORE_PAGE_SIZE, probe.total);
  const [{ rows }, cookbooks] = await Promise.all([
    listPublicRecipes({ category, offset: pagination.offset, limit: pagination.perPage }),
    pagination.page === 1 && !category ? listPublicCookbooks(8) : Promise.resolve([]),
  ]);
  const base = exploreBasePath(category);
  const jsonLd = itemListJsonLd(
    category ? `${categoryLabel(category)} recipes` : "Family recipes",
    rows.map((recipe) => publicRecipeUrl(recipe))
  );
  const pageHref = (page: number) => (page <= 1 ? base : `${base}?page=${page}`);

  return (
    <PublicShell>
      <main className="grid gap-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="grid gap-2">
          <h1 className="font-serif text-4xl leading-tight">{category ? categoryLabel(category) : "Explore family recipes"}</h1>
          <p className="text-muted">Recipes families have chosen to share from their Kitchen recipe boxes.</p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Categories">
          <Link
            href="/explore"
            className={`inline-flex min-h-10 items-center rounded-xl border px-3 py-2 no-underline ${category ? "border-line bg-white text-ink" : "border-clay bg-clay text-white"}`}
          >
            All
          </Link>
          {RECIPE_CATEGORIES.map((entry) => (
            <Link
              key={entry}
              href={`/explore/${entry}`}
              className={`inline-flex min-h-10 items-center rounded-xl border px-3 py-2 no-underline ${category === entry ? "border-clay bg-clay text-white" : "border-line bg-white text-ink"}`}
            >
              {categoryLabel(entry)}
            </Link>
          ))}
        </nav>

        {cookbooks.length > 0 ? (
          <section className="grid gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Shared cookbooks</h2>
            <ul className="flex flex-wrap gap-2">
              {cookbooks.map((cookbook) => (
                <li key={cookbook.id}>
                  <Link href={publicCookbookPath(cookbook)} className="inline-flex rounded-xl border border-line bg-white px-3 py-2 no-underline">
                    {cookbook.title} <span className="ml-2 text-sm text-muted">{cookbook.recipeCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {rows.length === 0 ? (
          <p className="text-muted">Nothing shared here yet. Public cookbooks show up as families share them.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rows.map((recipe) => (
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
                ownerName={recipe.owner.name}
              />
            ))}
          </ul>
        )}

        <AdSlot size="anchor" />

        {pagination.totalPages > 1 ? (
          <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
            {pagination.page > 1 ? (
              <Link rel="prev" href={pageHref(pagination.page - 1)} className="inline-flex min-h-12 items-center rounded-xl border border-line bg-white px-4 no-underline">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            {pagination.page < pagination.totalPages ? (
              <Link rel="next" href={pageHref(pagination.page + 1)} className="inline-flex min-h-12 items-center rounded-xl border border-line bg-white px-4 no-underline">
                Older →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </main>
    </PublicShell>
  );
}
