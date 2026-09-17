"use client";

import { useState } from "react";
import { recordMemory } from "@/app/actions/recipes";

function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "I made this" → date + note → recordMemory. `returnTo="cook"` lands back in cook mode. */
export function MadeThisButton({ recipeId, returnTo = "recipe", large = false }: { recipeId: string; returnTo?: "recipe" | "cook"; large?: boolean }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`btn inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 hover:bg-paper ${large ? "text-lg" : ""}`}
      >
        <span aria-hidden="true">✓</span> I made this
      </button>
    );
  }

  return (
    <form action={recordMemory} className="grid gap-3 rounded-2xl border border-line bg-white p-4">
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <label className="grid gap-1">
          <span className="text-sm font-medium">When</span>
          <input type="date" name="madeOn" defaultValue={today()} max={today()} className="rounded-xl border border-line bg-white px-3 py-3" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">A note for the family (optional)</span>
          <input name="note" maxLength={500} placeholder="Used the big pot. Everyone went back for seconds." className="rounded-xl border border-line bg-white px-3 py-3" />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn rounded-xl bg-clay px-4 py-2 text-white hover:bg-clay-dark">
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-line px-4 py-2">
          Cancel
        </button>
      </div>
    </form>
  );
}
