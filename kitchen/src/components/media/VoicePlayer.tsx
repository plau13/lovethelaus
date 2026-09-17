import { formatDuration } from "@/lib/media-limits";
import { mediaUrl } from "@/lib/paths";

export type VoiceMedia = {
  id: string;
  r2Key: string;
  caption: string;
  durationSeconds: number | null;
  creator?: { name: string } | null;
};

export function VoicePlayer({ voice, compact = false }: { voice: VoiceMedia; compact?: boolean }) {
  const duration = formatDuration(voice.durationSeconds);
  const byline = [voice.caption || null, voice.creator?.name ? `Recorded by ${voice.creator.name}` : null, duration || null]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="grid gap-2">
      <audio controls preload="metadata" src={mediaUrl(voice.r2Key)} className={compact ? "w-full" : "w-full max-w-lg"}>
        Your browser cannot play this recording.
      </audio>
      {byline ? <p className="text-sm text-muted">{byline}</p> : null}
    </div>
  );
}
