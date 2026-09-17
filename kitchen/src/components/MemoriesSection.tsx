import { removeMemory } from "@/app/actions/recipes";
import { MadeThisButton } from "@/components/MadeThisButton";
import { formatMadeOn, memorySummary } from "@/lib/heritage";

export type MemoryEntry = { id: string; madeOn: Date; note: string; user: { id: string; name: string } };

/** "Made this" history on the recipe page. */
export function MemoriesSection({ recipeId, memories, currentUserId, justSaved }: { recipeId: string; memories: MemoryEntry[]; currentUserId: string; justSaved?: boolean }) {
  const summary = memorySummary(memories.map((entry) => ({ madeOn: entry.madeOn, userName: entry.user.name })));
  const recent = memories.slice(0, 3);
  return (
    <section className="grid gap-3 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Made this</h2>
        <MadeThisButton recipeId={recipeId} />
      </div>
      {justSaved ? <p className="text-clay">Saved. Nice work.</p> : null}
      {summary ? <p className="text-muted">{summary}</p> : <p className="text-muted">Nobody has recorded making this yet. Be the first.</p>}
      {recent.length > 0 ? (
        <ul className="grid gap-2">
          {recent.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-3">
              <div>
                <p className="text-sm text-muted">
                  {entry.user.name} · {formatMadeOn(entry.madeOn)}
                </p>
                {entry.note ? <p>{entry.note}</p> : null}
              </div>
              {entry.user.id === currentUserId ? (
                <form action={removeMemory}>
                  <input type="hidden" name="recipeId" value={recipeId} />
                  <input type="hidden" name="memoryId" value={entry.id} />
                  <button type="submit" className="min-h-0 text-sm text-muted hover:text-clay" aria-label="Remove this entry">
                    Remove
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
