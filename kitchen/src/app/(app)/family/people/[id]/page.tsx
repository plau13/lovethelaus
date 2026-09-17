import Link from "next/link";
import { notFound } from "next/navigation";
import { removePerson } from "@/app/actions/people";
import { RecipeListItem } from "@/components/RecipeListItem";
import { requireOnboardedUser } from "@/lib/auth";
import { lifespan } from "@/lib/heritage";
import { getPerson } from "@/lib/people";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const person = await getPerson(id, user.id);
  if (!person) {
    notFound();
  }
  const years = lifespan(person.birthYear, person.passedYear);

  return (
    <main className="grid gap-6">
      <p className="text-muted">
        <Link href="/family">← Family</Link>
      </p>
      <div className="grid gap-1">
        <h1 className="font-serif text-4xl">{person.name}</h1>
        <p className="text-muted">{[person.relationship, years].filter(Boolean).join(" · ")}</p>
      </div>
      {person.bio ? <p className="whitespace-pre-line text-lg leading-relaxed">{person.bio}</p> : null}

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Recipes from {person.name}</h2>
        {person.recipes.length === 0 ? (
          <p className="text-muted">
            No recipes yet. Pick {person.name} under “Where it comes from” when you save a recipe.
          </p>
        ) : (
          <ul className="grid gap-3">
            {person.recipes.map((recipe) => (
              <RecipeListItem
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                category={recipe.category}
                cookMinutes={recipe.cookMinutes}
                difficulty={recipe.difficulty}
                tags={recipe.tags}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <Link href={`/family/people/${person.id}/edit`} className="inline-flex min-h-12 items-center rounded-xl border border-line bg-white px-4 no-underline">
          Edit
        </Link>
        <form action={removePerson}>
          <input type="hidden" name="personId" value={person.id} />
          <button type="submit" className="rounded-xl border border-line px-4 py-2 text-muted hover:text-clay">
            Remove person
          </button>
        </form>
      </div>
    </main>
  );
}
