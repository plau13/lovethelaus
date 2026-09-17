import { randomBytes } from "crypto";
import { baseContentType, mediaBucket } from "@/lib/media-storage";

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Matches the scanned-card cap from `media-storage.ts`. The old 1MB limit
 * rejected ordinary photos straight off a phone.
 */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_SIZE_MESSAGE = "Photos need to be under 5MB.";
export const PHOTO_TYPE_MESSAGE = "Use a JPG, PNG, or WebP photo.";

/** Same bucket as heritage media; photos live at the root, media under `media/`. */
const bucket = mediaBucket;

export function validatePhoto(photo: File): { ext: string; contentType: string } {
  const contentType = baseContentType(photo.type);
  const ext = PHOTO_TYPES[contentType];
  if (!ext) {
    throw new Error(PHOTO_TYPE_MESSAGE);
  }
  if (photo.size === 0) {
    throw new Error("That file is empty.");
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    throw new Error(PHOTO_SIZE_MESSAGE);
  }
  return { ext, contentType };
}

/** Upload to R2 and return the object key (stored in `recipe_photo.path`). */
export async function uploadRecipePhoto(recipeId: string, photo: File): Promise<{ key: string; contentType: string }> {
  const { ext, contentType } = validatePhoto(photo);
  const key = `${recipeId}/${randomBytes(8).toString("hex")}.${ext}`;
  await bucket().put(key, await photo.arrayBuffer(), { httpMetadata: { contentType } });
  return { key, contentType };
}

export async function readRecipePhoto(key: string): Promise<{ body: ReadableStream; contentType: string } | null> {
  let object: Awaited<ReturnType<ReturnType<typeof mediaBucket>["get"]>>;
  try {
    object = await bucket().get(key);
  } catch {
    return null;
  }
  if (!object?.body) {
    return null;
  }
  return {
    body: object.body,
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
  };
}

export async function deleteRecipePhotos(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }
  try {
    await bucket().delete(keys);
  } catch {
    // Storage unavailable (local Node build); the DB rows are removed by the caller regardless.
  }
}
