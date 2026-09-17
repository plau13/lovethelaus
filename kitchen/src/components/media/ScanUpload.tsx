"use client";

import { useState } from "react";
import { uploadScan } from "@/app/actions/media";

/** Photograph the handwritten card. `capture` opens the camera directly on a phone. */
export function ScanUpload({ recipeId }: { recipeId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn w-fit rounded-xl border border-line bg-white px-4 py-2 hover:bg-paper">
        Add the original card
      </button>
    );
  }

  return (
    <form action={uploadScan} className="grid gap-3 rounded-2xl border border-line bg-white p-4" encType="multipart/form-data">
      <input type="hidden" name="recipeId" value={recipeId} />
      <label className="grid gap-1">
        <span className="text-sm font-medium">Photo of the card</span>
        <input type="file" name="file" required accept="image/jpeg,image/png,image/webp" capture="environment" />
        <span className="text-sm text-muted">JPG, PNG, or WebP, up to 5MB. Lay it flat and fill the frame.</span>
      </label>
      <label className="grid gap-1">
        <span className="text-sm font-medium">Caption (optional)</span>
        <input name="caption" placeholder="In Grandma Rose's hand, on the back of an envelope" className="rounded-xl border border-line bg-white px-3 py-3" />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn rounded-xl bg-clay px-4 py-2 text-white hover:bg-clay-dark">
          Save the card
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-line px-4 py-2">
          Cancel
        </button>
      </div>
    </form>
  );
}
