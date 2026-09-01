import { notFound } from "next/navigation";
import { getPublicCookbook } from "@/lib/cookbooks";
import { splitLines } from "@/lib/tags";

export default async function PublicCookbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookbook = await getPublicCookbook(slug);
  if (!cookbook) {
    notFound();
  }
  return (
    <main className="grid gap-8">
      <h1 className="font-serif text-4xl">{cookbook.title}</h1>
      <p className="text-muted">A cookbook from {cookbook.owner.name}</p>
      {cookbook.recipes.map((entry) => (
        <article key={entry.id} id={entry.recipe.id} className="grid gap-3 border-t border-line pt-6">
          <h2 className="font-serif text-3xl">{entry.recipe.title}</h2>
          {entry.recipe.sourceUrl ? (
            <p className="text-sm text-muted">
              Source:{" "}
              <a href={entry.recipe.sourceUrl} target="_blank" rel="noreferrer">
                {entry.recipe.sourceUrl}
              </a>
            </p>
          ) : null}
          <h3 className="font-semibold">Ingredients</h3>
          <ul className="grid gap-1">
            {splitLines(entry.recipe.ingredients).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <h3 className="font-semibold">Steps</h3>
          <ol className="grid list-decimal gap-2 pl-5">
            {splitLines(entry.recipe.steps).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </article>
      ))}
    </main>
  );
}
