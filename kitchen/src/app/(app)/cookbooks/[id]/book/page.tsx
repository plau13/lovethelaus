import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/book/PrintButton";
import { requireOnboardedUser } from "@/lib/auth";
import { bookContributors, bookTitle, groupIntoChapters } from "@/lib/book";
import { getCookbookForBook } from "@/lib/cookbooks";
import { lifespan, provenanceLine } from "@/lib/heritage";
import { isSubscriber } from "@/lib/subscription";
import { splitLines } from "@/lib/tags";
import "./book.css";

export const metadata = { title: "Print this book" };

export default async function CookbookBookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const cookbook = await getCookbookForBook(id, user.id);
  if (!cookbook) {
    notFound();
  }

  if (!isSubscriber(user)) {
    return (
      <div className="grid gap-4">
        <h1 className="font-serif text-3xl">Print {cookbook.title} as a book</h1>
        <p className="text-muted">
          Kitchen Plus lays your cookbook out as a real book: a cover, a page for the people the
          recipes came from, and one recipe per page, ready to print or save as a PDF.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/settings" className="btn rounded-xl border border-line bg-white px-4 py-2 no-underline">
            Upgrade to Kitchen Plus
          </Link>
          <Link href={`/cookbooks/${cookbook.id}`} className="text-muted no-underline">
            Back to the cookbook
          </Link>
        </div>
      </div>
    );
  }

  const recipes = cookbook.recipes.map((entry) => entry.recipe);
  const chapters = groupIntoChapters(recipes);
  const contributors = bookContributors(recipes);
  const title = bookTitle(cookbook);
  const runningHead = title;

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/cookbooks/${cookbook.id}`} className="text-muted no-underline">
          Back to {cookbook.title}
        </Link>
        <PrintButton />
      </div>

      <div className="book-sheet">
        <section className="book-cover">
          {cookbook.familyName ? (
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">
              {cookbook.familyName}
            </p>
          ) : null}
          <h1 className="font-serif text-5xl leading-tight">{title}</h1>
          {cookbook.familyName && cookbook.title !== title ? (
            <p className="mt-2 font-serif text-xl text-muted">{cookbook.title}</p>
          ) : null}
          {cookbook.dedication ? (
            <p className="mx-auto mt-10 max-w-md font-serif text-lg italic">{cookbook.dedication}</p>
          ) : null}
          <p className="mt-10 text-sm text-muted">
            {recipes.length} recipe{recipes.length === 1 ? "" : "s"} · kept by {cookbook.owner.name}
          </p>
        </section>

        {contributors.length > 0 ? (
          <section className="book-contributors grid gap-4">
            <p className="book-running-head">{runningHead}</p>
            <h2 className="font-serif text-3xl">The people these came from</h2>
            <ul className="grid gap-3">
              {contributors.map((person) => {
                const years = lifespan(person.birthYear, person.passedYear);
                return (
                  <li key={person.id} className="grid gap-0.5">
                    <span className="font-medium">
                      {person.name}
                      {person.relationship ? <span className="text-muted"> · {person.relationship}</span> : null}
                      {years ? <span className="text-muted"> · {years}</span> : null}
                    </span>
                    <span className="text-sm text-muted">
                      {person.recipeCount} recipe{person.recipeCount === 1 ? "" : "s"} in this book
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {recipes.length === 0 ? (
          <p className="text-muted">Add recipes to this cookbook and they will appear here as pages.</p>
        ) : null}

        {chapters.map((chapter) =>
          chapter.recipes.map((recipe, index) => {
            const provenance = provenanceLine({
              person: recipe.originPerson,
              firstMadeYear: recipe.firstMadeYear,
              occasion: recipe.occasion,
            });
            const ingredients = splitLines(recipe.ingredients);
            const steps = splitLines(recipe.steps);
            const bakingSteps = splitLines(recipe.bakingSteps);
            return (
              <article key={recipe.id} className="book-recipe">
                <p className="book-running-head">{runningHead}</p>
                {index === 0 ? (
                  <p className="text-xs font-semibold tracking-widest text-muted uppercase">{chapter.title}</p>
                ) : null}
                <h2 className="font-serif text-3xl leading-tight">{recipe.title}</h2>
                {provenance ? <p className="text-muted">{provenance}</p> : null}
                {recipe.story ? <p className="font-serif italic">{recipe.story}</p> : null}
                <p className="text-sm text-muted">
                  {[
                    recipe.servings ? `Serves ${recipe.servings}` : null,
                    recipe.cookMinutes ? `${recipe.cookMinutes} min` : null,
                    recipe.difficulty,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                <div className="book-ingredients grid gap-2">
                  <h3 className="font-semibold">Ingredients</h3>
                  <ul className="grid gap-1">
                    {ingredients.map((line, lineIndex) => (
                      <li key={`ing-${lineIndex}`}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="book-steps grid gap-2">
                  <h3 className="font-semibold">
                    {bakingSteps.length > 0 ? "Cooking instructions" : "Instructions"}
                  </h3>
                  <ol className="grid list-decimal gap-2 pl-5">
                    {steps.map((line, lineIndex) => (
                      <li key={`step-${lineIndex}`}>{line}</li>
                    ))}
                  </ol>
                </div>

                {bakingSteps.length > 0 ? (
                  <div className="book-steps grid gap-2">
                    <h3 className="font-semibold">Baking instructions</h3>
                    <ol className="grid list-decimal gap-2 pl-5">
                      {bakingSteps.map((line, lineIndex) => (
                        <li key={`bake-${lineIndex}`}>{line}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </article>
            );
          }),
        )}
      </div>
    </>
  );
}
