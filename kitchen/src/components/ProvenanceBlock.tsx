import Link from "next/link";
import { provenanceLine } from "@/lib/heritage";

export type ProvenanceBlockProps = {
  recipeId: string;
  canEdit: boolean;
  person: { id: string; name: string; relationship: string | null } | null;
  story: string;
  firstMadeYear: number | null;
  occasion: string | null;
  adaptedFrom: { id: string; title: string; ownerName: string; viewable: boolean } | null;
  adaptations: { id: string; title: string; ownerName: string }[];
};

/** "Where it comes from": provenance, story, and lineage for a recipe. Server component. */
export function ProvenanceBlock({ recipeId, canEdit, person, story, firstMadeYear, occasion, adaptedFrom, adaptations }: ProvenanceBlockProps) {
  const line = provenanceLine({ person, firstMadeYear, occasion });
  const empty = !line && !story && !adaptedFrom && adaptations.length === 0;

  if (empty) {
    if (!canEdit) {
      return null;
    }
    return (
      <section className="rounded-2xl border border-dashed border-line bg-paper p-5">
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Where it comes from</h2>
        <p className="text-muted">
          Who taught you this, when it was first made, and the story behind it.{" "}
          <Link href={`/recipes/${recipeId}/edit#provenance`} className="text-clay">
            Add it
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Where it comes from</h2>
        {canEdit ? (
          <Link href={`/recipes/${recipeId}/edit#provenance`} className="text-sm">
            Edit
          </Link>
        ) : null}
      </div>
      {line ? (
        <p className="font-serif text-2xl leading-snug">
          {person ? (
            <>
              From{" "}
              <Link href={`/family/people/${person.id}`} className="text-ink no-underline hover:text-clay">
                {person.name}
              </Link>
              {person.relationship ? <span className="text-muted"> ({person.relationship})</span> : null}
              {firstMadeYear || occasion ? <span className="text-muted"> · </span> : null}
            </>
          ) : null}
          {firstMadeYear ? <span className="text-muted">first made {firstMadeYear}</span> : null}
          {firstMadeYear && occasion ? <span className="text-muted"> · </span> : null}
          {occasion ? <span className="text-muted">{occasion}</span> : null}
        </p>
      ) : null}
      {story ? <p className="mt-3 whitespace-pre-line text-lg leading-relaxed">{story}</p> : null}
      {adaptedFrom ? (
        <p className="mt-3 text-muted">
          Adapted from{" "}
          {adaptedFrom.viewable ? (
            <Link href={`/recipes/${adaptedFrom.id}`}>{adaptedFrom.title}</Link>
          ) : (
            <em>{adaptedFrom.title}</em>
          )}{" "}
          by {adaptedFrom.ownerName}
        </p>
      ) : null}
      {adaptations.length > 0 ? (
        <p className="mt-2 text-muted">
          Adapted by:{" "}
          {adaptations.map((entry, index) => (
            <span key={entry.id}>
              {index > 0 ? ", " : null}
              <Link href={`/recipes/${entry.id}`}>{entry.title}</Link> ({entry.ownerName})
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}
