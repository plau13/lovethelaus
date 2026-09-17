import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomBytes } from "crypto";

/**
 * Byte range for a partial read (audio scrubbing sends these). R2 accepts either
 * an offset (with an optional length) or a suffix, never both.
 */
export type ByteRange = { offset: number; length?: number } | { suffix: number };

export type StoredObject = {
  body: ReadableStream;
  contentType: string;
  size: number;
  /** Set when the read was a partial one. */
  range?: { offset: number; end: number };
};

type R2Object = {
  body: ReadableStream | null;
  size: number;
  httpMetadata?: { contentType?: string };
  range?: { offset?: number; length?: number; suffix?: number };
};

type MediaBucket = {
  put: (
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } }
  ) => Promise<unknown>;
  get: (key: string, options?: { range?: ByteRange }) => Promise<R2Object | null>;
  delete: (keys: string | string[]) => Promise<void>;
};

/**
 * The R2 bucket behind recipe photos and heritage media. Both live in `RECIPE_PHOTOS`;
 * media objects are namespaced under `media/` so one bucket covers everything.
 */
export function mediaBucket(): MediaBucket {
  try {
    const { env } = getCloudflareContext();
    const found = (env as { RECIPE_PHOTOS?: MediaBucket }).RECIPE_PHOTOS;
    if (found) {
      return found;
    }
  } catch {
    // fall through to the explicit error below
  }
  throw new Error(
    "Media storage is not configured. Bind the RECIPE_PHOTOS R2 bucket (wrangler.jsonc) — `next dev` uses a local simulation."
  );
}

export const MEDIA_KINDS = ["scan", "voice"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** A handwritten card needs more detail than a dish photo, so scans get a larger cap. */
export const MEDIA_RULES: Record<MediaKind, { types: Record<string, string>; maxBytes: number; label: string; limitLabel: string }> = {
  scan: {
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    maxBytes: 5 * 1024 * 1024,
    label: "Use a JPG, PNG, or WebP photo of the card.",
    limitLabel: "Card photos need to be under 5MB.",
  },
  voice: {
    types: {
      "audio/webm": "webm",
      "audio/mp4": "m4a",
      "audio/mpeg": "mp3",
      "audio/ogg": "ogg",
    },
    maxBytes: 10 * 1024 * 1024,
    label: "Use a WebM, MP4/M4A, MP3, or OGG recording.",
    limitLabel: "Recordings need to be under 10MB.",
  },
};

export function isMediaKind(value: string): value is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(value);
}

/** Browsers append codec parameters (`audio/webm;codecs=opus`); match on the base type. */
export function baseContentType(type: string): string {
  return type.split(";")[0].trim().toLowerCase();
}

export function validateMedia(kind: MediaKind, file: File): { ext: string; contentType: string } {
  const rules = MEDIA_RULES[kind];
  const contentType = baseContentType(file.type);
  const ext = rules.types[contentType];
  if (!ext) {
    throw new Error(rules.label);
  }
  if (file.size === 0) {
    throw new Error("That file is empty.");
  }
  if (file.size > rules.maxBytes) {
    throw new Error(rules.limitLabel);
  }
  return { ext, contentType };
}

/** Upload and return the R2 object key (stored in `recipe_media.r2Key`). */
export async function uploadMedia(recipeId: string, kind: MediaKind, file: File): Promise<{ key: string; contentType: string }> {
  const { ext, contentType } = validateMedia(kind, file);
  const key = `media/${recipeId}/${randomBytes(8).toString("hex")}.${ext}`;
  await mediaBucket().put(key, await file.arrayBuffer(), { httpMetadata: { contentType } });
  return { key, contentType };
}

export async function readMedia(key: string, range?: ByteRange): Promise<StoredObject | null> {
  let object: R2Object | null;
  try {
    object = await mediaBucket().get(key, range ? { range } : undefined);
  } catch {
    return null;
  }
  if (!object?.body) {
    return null;
  }
  const offset = object.range?.offset ?? 0;
  const length = object.range?.length;
  return {
    body: object.body,
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
    size: object.size,
    ...(range && length !== undefined ? { range: { offset, end: offset + length - 1 } } : {}),
  };
}

export async function deleteMedia(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }
  try {
    await mediaBucket().delete(keys);
  } catch {
    // Storage unavailable (local Node build); the DB rows are removed by the caller regardless.
  }
}

/** Parse a single `Range: bytes=...` header into an R2 range. Null when absent or unsupported. */
export function parseRangeHeader(header: string | null, size: number): ByteRange | null {
  if (!header) {
    return null;
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) {
    return null;
  }
  const [, startRaw, endRaw] = match;
  if (startRaw === "" && endRaw === "") {
    return null;
  }
  if (startRaw === "") {
    const suffix = Number.parseInt(endRaw, 10);
    return suffix > 0 ? { suffix: Math.min(suffix, size) } : null;
  }
  const offset = Number.parseInt(startRaw, 10);
  if (offset >= size) {
    return null;
  }
  if (endRaw === "") {
    return { offset };
  }
  const end = Math.min(Number.parseInt(endRaw, 10), size - 1);
  return { offset, length: end - offset + 1 };
}
