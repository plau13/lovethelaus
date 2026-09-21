import Link from "next/link";
import { QueryFlash } from "@/components/QueryFlash";
import { requireOnboardedUser } from "@/lib/auth";
import { formatMadeOn, lifespan } from "@/lib/heritage";
import { familyTimeline } from "@/lib/memories";
import { peopleWithRecipeCounts } from "@/lib/people";

export default async function FamilyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await requireOnboardedUser();
  const [people, timeline] = await Promise.all([peopleWithRecipeCounts(user.id), familyTimeline(user.id)]);

  return (
    <main className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="font-serif text-4xl">Family</h1>
        <p className="text-muted">The people behind the recipes, and every time someone made one.</p>
        <QueryFlash error={error} />
      </div>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">People</h2>
          <Link href="/family/people/new" className="btn-clay btn-clay-hover inline-flex min-h-12 items-center rounded-xl px-4 py-2 no-underline">
            Add a person
          </Link>
        </div>
        {people.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-paper p-5 text-muted">
            Add the people your recipes come from: a grandmother, a neighbour, the uncle who only cooks on holidays. They do not need an
            account. Then pick them under “Where it comes from” when you save a recipe.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {people.map((person) => (
              <li key={person.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <Link href={`/family/people/${person.id}`} className="font-serif text-2xl text-ink no-underline">
                  {person.name}
                </Link>
                <p className="mt-1 text-muted">
                  {[person.relationship, lifespan(person.birthYear, person.passedYear), `${person.recipeCount} recipe${person.recipeCount === 1 ? "" : "s"}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-paper p-5 text-muted">
            Nothing here yet. Tap “I made this” on a recipe, or add the year a recipe was first made, and it shows up here.
          </p>
        ) : (
          <ol className="grid gap-2 border-l-2 border-line pl-4">
            {timeline.map((entry) => (
              <li key={entry.id} className="relative rounded-xl border border-line bg-white p-3">
                <span aria-hidden="true" className="absolute -left-[1.45rem] top-4 size-3 rounded-full border-2 border-paper bg-clay" />
                {entry.kind === "memory" ? (
                  <>
                    <p>
                      <strong>{entry.userName}</strong> made <Link href={`/recipes/${entry.recipe.id}`}>{entry.recipe.title}</Link>
                      <span className="text-muted"> · {formatMadeOn(entry.date)}</span>
                    </p>
                    {entry.note ? <p className="text-muted">“{entry.note}”</p> : null}
                  </>
                ) : (
                  <p>
                    <Link href={`/family/people/${entry.personId}`}>{entry.personName}</Link>
                    &rsquo;s <Link href={`/recipes/${entry.recipe.id}`}>{entry.recipe.title}</Link>
                    <span className="text-muted"> · first made {entry.firstMadeYear}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
