import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { getCurrentUser } from "@/lib/auth";
import { parseRangeHeader, readMedia } from "@/lib/media-storage";
import { canViewRecipe } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * Serves scanned cards and voice memos with the same visibility rules as the recipe.
 * Range requests are honoured so audio can be scrubbed (Safari refuses to play without them).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: keyParts } = await params;
  const key = keyParts.map((part) => decodeURIComponent(part)).join("/");

  const db = getDb();
  const media = await db.query.recipeMedia.findFirst({
    where: eq(schema.recipeMedia.r2Key, key),
    with: {
      recipe: {
        columns: { ownerId: true },
        with: { cookbookRecipes: { with: { cookbook: { with: { members: { columns: { userId: true } } } } } } },
      },
    },
  });
  if (!media) {
    return new Response("Not found", { status: 404 });
  }

  const user = await getCurrentUser();
  const allowed = canViewRecipe({
    userId: user?.id ?? null,
    recipeOwnerId: media.recipe.ownerId,
    containingCookbooks: media.recipe.cookbookRecipes.map((entry) => ({
      visibility: entry.cookbook.visibility,
      ownerId: entry.cookbook.ownerId,
      memberUserIds: entry.cookbook.members.map((member) => member.userId),
    })),
  });
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const head = await readMedia(key);
  if (!head) {
    return new Response("Not found", { status: 404 });
  }

  const range = parseRangeHeader(request.headers.get("range"), head.size);
  if (!range) {
    return new Response(head.body, {
      headers: {
        "Content-Type": media.contentType ?? head.contentType,
        "Content-Length": String(head.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const partial = await readMedia(key, range);
  if (!partial?.range) {
    return new Response(head.body, {
      headers: {
        "Content-Type": media.contentType ?? head.contentType,
        "Content-Length": String(head.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const { offset, end } = partial.range;
  return new Response(partial.body, {
    status: 206,
    headers: {
      "Content-Type": media.contentType ?? partial.contentType,
      "Content-Length": String(end - offset + 1),
      "Content-Range": `bytes ${offset}-${end}/${head.size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
