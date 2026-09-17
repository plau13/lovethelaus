import { removeMedia } from "@/app/actions/media";
import { applyTranscript } from "@/app/actions/recipes";
import { transcribeScanAction } from "@/app/actions/transcribe";
import { mediaUrl } from "@/lib/paths";

export type ScanMedia = {
  id: string;
  r2Key: string;
  caption: string;
  transcript: string;
  creator?: { name: string } | null;
};

/** One scanned card: the image, its transcript, and the actions an editor can take. */
export function ScanPanel({
  recipeId,
  scan,
  canEdit,
  canTranscribe,
  recipeIsEmpty,
}: {
  recipeId: string;
  scan: ScanMedia;
  canEdit: boolean;
  canTranscribe: boolean;
  recipeIsEmpty: boolean;
}) {
  return (
    <figure className="grid gap-3 rounded-2xl border border-line bg-white p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaUrl(scan.r2Key)}
        alt={scan.caption || "The original handwritten recipe card"}
        loading="lazy"
        className="w-full rounded-xl border border-line object-contain"
      />
      {scan.caption ? <figcaption className="text-sm text-muted">{scan.caption}</figcaption> : null}

      {scan.transcript ? (
        <div className="grid gap-2 rounded-xl border border-line bg-paper p-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">What the card says</h3>
          <p className="whitespace-pre-line">{scan.transcript}</p>
          {canEdit && recipeIsEmpty ? (
            <form action={applyTranscript}>
              <input type="hidden" name="recipeId" value={recipeId} />
              <input type="hidden" name="mediaId" value={scan.id} />
              <button type="submit" className="btn w-fit rounded-xl border border-line bg-white px-4 py-2 hover:bg-white/60">
                Use as this recipe&rsquo;s ingredients and steps
              </button>
            </form>
          ) : null}
        </div>
      ) : canEdit && canTranscribe ? (
        <form action={transcribeScanAction}>
          <input type="hidden" name="recipeId" value={recipeId} />
          <input type="hidden" name="mediaId" value={scan.id} />
          <button type="submit" className="btn w-fit rounded-xl border border-line px-4 py-2 hover:bg-paper">
            Read this card
          </button>
        </form>
      ) : canEdit ? (
        <p className="text-sm text-muted">Kitchen Plus can read a handwritten card into the recipe for you.</p>
      ) : null}

      {canEdit ? (
        <form action={removeMedia}>
          <input type="hidden" name="mediaId" value={scan.id} />
          <button type="submit" className="min-h-0 w-fit text-sm text-muted hover:text-clay">
            Remove this card
          </button>
        </form>
      ) : null}
    </figure>
  );
}
