import { removeMedia } from "@/app/actions/media";
import { ScanPanel, type ScanMedia } from "@/components/media/ScanPanel";
import { ScanUpload } from "@/components/media/ScanUpload";
import { VoicePlayer, type VoiceMedia } from "@/components/media/VoicePlayer";
import { VoiceRecorder } from "@/components/media/VoiceRecorder";
import { canAddMedia } from "@/lib/media-limits";

export type HeritageMedia = ScanMedia & VoiceMedia & { kind: string };

/** "The original card" and "In their own voice" on the recipe page. */
export function MediaSection({
  recipeId,
  media,
  canEdit,
  subscriber,
  aiConfigured,
  recipeIsEmpty,
}: {
  recipeId: string;
  media: HeritageMedia[];
  canEdit: boolean;
  subscriber: boolean;
  /** No ANTHROPIC_API_KEY means "Read this card" would always fail, so it is hidden. */
  aiConfigured: boolean;
  recipeIsEmpty: boolean;
}) {
  const scans = media.filter((entry) => entry.kind === "scan");
  const voices = media.filter((entry) => entry.kind === "voice");
  const scanAllowance = canAddMedia({ kind: "scan", existingCount: scans.length, subscriber });
  const voiceAllowance = canAddMedia({ kind: "voice", existingCount: voices.length, subscriber });

  if (!canEdit && scans.length === 0 && voices.length === 0) {
    return null;
  }

  return (
    <section id="heritage-media" className="grid gap-6 no-print">
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">The original card</h2>
        {scans.length === 0 ? (
          <p className="text-muted">
            {canEdit
              ? "A photo of the handwritten card keeps the handwriting, the splatters, and the margin notes."
              : "No card photo yet."}
          </p>
        ) : (
          <div className="grid gap-4">
            {scans.map((scan) => (
              <ScanPanel
                key={scan.id}
                recipeId={recipeId}
                scan={scan}
                canEdit={canEdit}
                canTranscribe={subscriber && aiConfigured}
                recipeIsEmpty={recipeIsEmpty}
              />
            ))}
          </div>
        )}
        {canEdit ? (
          scanAllowance.allowed ? (
            <ScanUpload recipeId={recipeId} />
          ) : (
            <p className="text-sm text-muted">{scanAllowance.reason}</p>
          )
        ) : null}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">In their own voice</h2>
        {voices.length === 0 ? (
          <p className="text-muted">
            {canEdit ? "Record them talking through it. It plays right here and in cook mode." : "No recording yet."}
          </p>
        ) : (
          <ul className="grid gap-4">
            {voices.map((voice) => (
              <li key={voice.id} className="grid gap-2 rounded-2xl border border-line bg-white p-4">
                <VoicePlayer voice={voice} />
                {canEdit ? (
                  <form action={removeMedia}>
                    <input type="hidden" name="mediaId" value={voice.id} />
                    <button type="submit" className="min-h-0 w-fit text-sm text-muted hover:text-clay">
                      Remove this recording
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          voiceAllowance.allowed ? (
            <VoiceRecorder recipeId={recipeId} />
          ) : (
            <p className="text-sm text-muted">{voiceAllowance.reason}</p>
          )
        ) : null}
      </section>
    </section>
  );
}
