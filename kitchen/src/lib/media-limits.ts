import type { MediaKind } from "@/lib/media-storage";

/**
 * Free accounts get one scanned card and one voice memo per recipe — enough to
 * prove the feature and to keep a family's most important recipe whole.
 * Kitchen Plus removes the cap. See docs/HERITAGE.md.
 */
export const FREE_SCANS_PER_RECIPE = 1;
export const FREE_VOICE_PER_RECIPE = 1;

export function freeLimitFor(kind: MediaKind): number {
  return kind === "scan" ? FREE_SCANS_PER_RECIPE : FREE_VOICE_PER_RECIPE;
}

export type MediaAllowance = { allowed: boolean; reason: string };

export function canAddMedia(args: { kind: MediaKind; existingCount: number; subscriber: boolean }): MediaAllowance {
  if (args.subscriber) {
    return { allowed: true, reason: "" };
  }
  const limit = freeLimitFor(args.kind);
  if (args.existingCount < limit) {
    return { allowed: true, reason: "" };
  }
  const noun = args.kind === "scan" ? "card photo" : "voice memo";
  return {
    allowed: false,
    reason: `Free accounts keep ${limit} ${noun} per recipe. Kitchen Plus adds as many as you like.`,
  };
}

export function mediaKindLabel(kind: MediaKind): string {
  return kind === "scan" ? "The original card" : "In their own voice";
}

/** "2:05" from a duration in seconds. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) {
    return "";
  }
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}
