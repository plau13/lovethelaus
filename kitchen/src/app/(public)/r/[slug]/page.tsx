import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { IngredientsCard, StepsCard } from "@/components/RecipeSections";
import { PublicShell } from "@/components/PublicShell";
import { photoUrl, publicCookbookPath, publicRecipeUrl } from "@/lib/paths";
import { getPublicRecipe } from "@/lib/public-recipes";
import { recipeDescription, recipeImageUrl, recipeJsonLd } from "@/lib/public-seo";
import { parseTags, splitLines } from "@/lib/tags";
import { categoryLabel, difficultyLabel, formatCookMinutes } from "@/lib/types";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPublicRecipe(slug);
  if (!found) {
    return { title: "Recipe not found" };
  }
  const { recipe, indexable } = found;
  const description = recipeDescription(recipe);
  const image = recipeImageUrl(recipe);
  const url = publicRecipeUrl(recipe);
  return {
    title: `${recipe.title} · Kitchen`,
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: recipe.title,
      description,
      url,
      siteName: "Kitchen",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: recipe.title, description },
  };
}

export default async function PublicRecipePage({ params }: Params) {
  const { slug } = await params;
  const found = await getPublicRecipe(slug);
  if (!found) {
    notFound();
  }
  const { recipe, cookbooks, indexable } = found;
  const ingredientLines = splitLines(recipe.ingredients);
  const cookingSteps = splitLines(recipe.steps);
  const bakingSteps = splitLines(recipe.bakingSteps);
  const cookTime = formatCookMinutes(recipe.cookMinutes);
  const meta = [
    recipe.category ? categoryLabel(recipe.category) : null,
    cookTime || null,
    recipe.difficulty ? difficultyLabel(recipe.difficulty) : null,
    recipe.servings ? `${recipe.servings} servings` : null,
    parseTags(recipe.tags).length ? parseTags(recipe.tags).join(" · ") : null,
  ].filter(Boolean);
  const photo = recipe.photos[0] ?? null;
  const jsonLd = recipeJsonLd(recipe);

  return (
    <PublicShell ads={indexable}>
      <main className="grid gap-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/explore">Explore</Link>
          {cookbooks[0] ? (
            <>
              {" / "}
              <Link href={publicCookbookPath(cookbooks[0])}>{cookbooks[0].title}</Link>
            </>
          ) : null}
        </nav>
        <h1 className="font-serif text-4xl leading-tight">{recipe.title}</h1>
        <p className="text-muted">From {recipe.owner.name}&rsquo;s kitchen</p>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(photo.path)} alt={photo.alt || recipe.title} className="max-h-96 w-full rounded-2xl object-cover" />
        ) : null}
        {recipe.story ? <p className="text-lg leading-relaxed">{recipe.story}</p> : null}
        {meta.length > 0 ? <p className="text-muted">{meta.join(" · ")}</p> : null}
        {recipe.sourceAttribution ? <p className="text-sm text-muted">{recipe.sourceAttribution}</p> : null}

        <IngredientsCard lines={ingredientLines} />
        {indexable ? <AdSlot size="inline" /> : null}
        <StepsCard title="Cooking instructions" steps={cookingSteps} prefix="cook" />
        <StepsCard title="Baking instructions" steps={bakingSteps} prefix="bake" />
        {indexable ? <AdSlot size="anchor" /> : null}

        {cookbooks.length > 0 ? (
          <section className="grid gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">In these cookbooks</h2>
            <ul className="flex flex-wrap gap-2">
              {cookbooks.map((cookbook) => (
                <li key={cookbook.id}>
                  <Link href={publicCookbookPath(cookbook)} className="inline-flex rounded-xl border border-line bg-white px-3 py-2 no-underline">
                    {cookbook.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-serif text-2xl">Keep this one in your own Kitchen</h2>
          <p className="text-muted">
            Kitchen is a private family recipe box. Save recipes, cook from the counter, and share cookbooks with the people who matter.
          </p>
          <Link href="/sign-up" className="btn-clay btn-clay-hover inline-flex w-fit min-h-12 items-center rounded-xl px-5 py-3 no-underline">
            Start your recipe box
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
