import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomBytes } from "crypto";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type R2Bucket = {
  put: (key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  get: (key: string) => Promise<{ body: ReadableStream | null; httpMetadata?: { contentType?: string } } | null>;
};

function r2Bucket(): R2Bucket | null {
  try {
    const { env } = getCloudflareContext();
    const bucket = (env as { RECIPE_PHOTOS?: R2Bucket }).RECIPE_PHOTOS;
    return bucket ?? null;
  } catch {
    return null;
  }
}

export async function uploadRecipePhoto(recipeId: string, photo: File): Promise<string> {
  const ext = PHOTO_TYPES[photo.type];
  if (!ext) {
    throw new Error("Use a JPG, PNG, or WebP photo.");
  }
  if (photo.size > 1 * 1024 * 1024) {
    throw new Error("Photos need to be under 1MB.");
  }

  const key = `${recipeId}/${randomBytes(8).toString("hex")}.${ext}`;
  const bucket = r2Bucket();

  if (bucket) {
    const buffer = await photo.arrayBuffer();
    await bucket.put(key, buffer, {
      httpMetadata: { contentType: photo.type },
    });
    return `/kitchen/api/recipe-photos/${key}`;
  }

  // Local dev fallback: Supabase Storage or filesystem via caller
  throw new Error("Photo storage is not configured. Set up R2 (production) or use local dev.");
}

export async function readRecipePhoto(key: string): Promise<{ body: ReadableStream; contentType: string } | null> {
  const bucket = r2Bucket();
  if (!bucket) {
    return null;
  }
  const object = await bucket.get(key);
  if (!object?.body) {
    return null;
  }
  return {
    body: object.body,
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
  };
}

export function photoKeyFromPath(path: string): string | null {
  const prefixes = ["/kitchen/api/recipe-photos/", "/api/recipe-photos/"];
  const prefix = prefixes.find((p) => path.startsWith(p));
  if (!prefix) {
    return null;
  }
  return path.slice(prefix.length);
}
