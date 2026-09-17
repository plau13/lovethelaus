"use client";

import { useState } from "react";
import { uploadPhoto } from "@/app/actions/photos";

/** Add a photo of the finished dish. `capture` opens the camera directly on a phone. */
export function PhotoUpload({ recipeId, hasPhotos }: { recipeId: string; hasPhotos: boolean }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn w-fit rounded-xl border border-line bg-white px-4 py-2 hover:bg-paper"
      >
        {hasPhotos ? "Add another photo" : "Add a photo"}
      </button>
    );
  }

  return (
    <form
      action={uploadPhoto}
      className="grid gap-3 rounded-2xl border border-line bg-white p-4"
      encType="multipart/form-data"
    >
      <input type="hidden" name="recipeId" value={recipeId} />
      <label className="grid gap-1">
        <span className="text-sm font-medium">Photo</span>
        <input
          type="file"
          name="photo"
          required
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
        />
        <span className="text-sm text-muted">JPG, PNG, or WebP, up to 5MB.</span>
      </label>
      <label className="grid gap-1">
        <span className="text-sm font-medium">Describe it (optional)</span>
        <input
          name="alt"
          placeholder="The pie just out of the oven"
          className="rounded-xl border border-line bg-white px-3 py-3"
        />
        <span className="text-sm text-muted">Read aloud to anyone using a screen reader.</span>
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn rounded-xl bg-clay px-4 py-2 text-white hover:bg-clay-dark">
          Save the photo
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-line px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
