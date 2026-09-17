"use client";

import { useActionState, useState } from "react";
import { createPersonInline, type InlinePersonState } from "@/app/actions/people";
import { COMMON_OCCASIONS } from "@/lib/heritage";

export type PersonOption = { id: string; name: string; relationship: string | null };
export type AdaptableRecipe = { id: string; title: string };

export type ProvenanceDefaults = {
  story?: string;
  originPersonId?: string | null;
  adaptedFromRecipeId?: string | null;
  firstMadeYear?: number | null;
  occasion?: string | null;
};

const inputClass = "rounded-xl border border-line bg-white px-3 py-3";

/** "Where it comes from" card inside the recipe editor. Lives inside the editor's <form>. */
export function ProvenanceFields({
  people: initialPeople,
  adaptableRecipes,
  defaults,
}: {
  people: PersonOption[];
  adaptableRecipes: AdaptableRecipe[];
  defaults?: ProvenanceDefaults;
}) {
  const [people, setPeople] = useState(initialPeople);
  const [personId, setPersonId] = useState(defaults?.originPersonId ?? "");
  const [adding, setAdding] = useState(false);
  const [state, formAction, pending] = useActionState(createPersonInline, { ok: false } as InlinePersonState);

  // When the inline add succeeds, add the person to the list and select them.
  const [handledId, setHandledId] = useState<string | null>(null);
  if (state.ok && state.id && handledId !== state.id) {
    setHandledId(state.id);
    setPeople((current) => (current.some((entry) => entry.id === state.id) ? current : [...current, { id: state.id!, name: state.name ?? "", relationship: state.relationship ?? null }]));
    setPersonId(state.id);
    setAdding(false);
  }

  return (
    <section id="provenance" className="grid gap-4 rounded-2xl border border-line bg-white p-5">
      <div className="grid gap-1">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Where it comes from</h2>
        <p className="text-sm text-muted">All optional. This is what makes it a family recipe and not just a recipe.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-medium">Who it came from</span>
          <select name="originPersonId" value={personId} onChange={(event) => setPersonId(event.target.value)} className={inputClass}>
            <option value="">Nobody in particular</option>
            {people.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
                {entry.relationship ? ` (${entry.relationship})` : ""}
              </option>
            ))}
          </select>
          {!adding ? (
            <button type="button" onClick={() => setAdding(true)} className="w-fit text-sm text-clay">
              + Add someone
            </button>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="font-medium">First made (year)</span>
          <input
            name="firstMadeYear"
            inputMode="numeric"
            pattern="[0-9]{4}"
            placeholder="1974"
            defaultValue={defaults?.firstMadeYear ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      {adding ? (
        <form action={formAction} className="grid gap-3 rounded-xl border border-dashed border-line bg-paper p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Name</span>
            <input name="name" required placeholder="Grandma Rose" className={inputClass} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Relationship</span>
            <input name="relationship" placeholder="grandmother" className={inputClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn rounded-xl bg-clay px-4 py-2 text-white hover:bg-clay-dark disabled:opacity-60">
              {pending ? "Adding…" : "Add"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-line px-4 py-2">
              Cancel
            </button>
          </div>
          {state.error ? <p className="text-sm text-clay sm:col-span-3">{state.error}</p> : null}
        </form>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-medium">Occasion</span>
          <input name="occasion" list="occasion-options" placeholder="Sunday dinner" defaultValue={defaults?.occasion ?? ""} className={inputClass} />
          <datalist id="occasion-options">
            {COMMON_OCCASIONS.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Adapted from</span>
          <select name="adaptedFromRecipeId" defaultValue={defaults?.adaptedFromRecipeId ?? ""} className={inputClass}>
            <option value="">Not adapted from another recipe</option>
            {adaptableRecipes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1">
        <span className="font-medium">The story</span>
        <textarea
          name="story"
          rows={4}
          defaultValue={defaults?.story ?? ""}
          placeholder="She made this every Sunday after church. The secret was letting it rest…"
          className={inputClass}
        />
      </label>
    </section>
  );
}
