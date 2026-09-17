import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomBytes } from "crypto";

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_PHOTO_BYTES = 1 * 1024 * 1024;

type PhotoBucket = {
  put: (
    key: string,
    value: ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: { contentType?: string } }
  ) => Promise<unknown>;
  get: (key: string) => Promise<{ body: ReadableStream | null; httpMetadata?: { contentType?: string } } | null>;
  delete: (keys: string | string[]) => Promise<void>;
};

function bucket(): PhotoBucket {
  try {
    const { env } = getCloudflareContext();
    const found = (env as { RECIPE_PHOTOS?: PhotoBucket }).RECIPE_PHOTOS;
    if (found) {
      return found;
    }
  } catch {
    // fall through
  }
  throw new Error(
    "Photo storage is not configured. Bind the RECIPE_PHOTOS R2 bucket (wrangler.jsonc) — `next dev` uses a local simulation."
  );
}

export function validatePhoto(photo: File): { ext: string; contentType: string } {
  const ext = PHOTO_TYPES[photo.type];
  if (!ext) {
    throw new Error("Use a JPG, PNG, or WebP photo.");
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    throw new Error("Photos need to be under 1MB.");
  }
  return { ext, contentType: photo.type };
}

/** Upload to R2 and return the object key (stored in `recipe_photo.path`). */
export async function uploadRecipePhoto(recipeId: string, photo: File): Promise<{ key: string; contentType: string }> {
  const { ext, contentType } = validatePhoto(photo);
  const key = `${recipeId}/${randomBytes(8).toString("hex")}.${ext}`;
  await bucket().put(key, await photo.arrayBuffer(), { httpMetadata: { contentType } });
  return { key, contentType };
}

export async function readRecipePhoto(key: string): Promise<{ body: ReadableStream; contentType: string } | null> {
  let object: Awaited<ReturnType<PhotoBucket["get"]>>;
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
