import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { getCurrentUser } from "@/lib/auth";
import { reportRequestError } from "@/lib/log";
import { canViewRecipe } from "@/lib/permissions";
import { readRecipePhoto } from "@/lib/recipe-photos";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: keyParts } = await params;
  const key = keyParts.map((part) => decodeURIComponent(part)).join("/");

  const db = getDb();
  const photo = await db.query.recipePhoto.findFirst({
    where: eq(schema.recipePhoto.path, key),
    with: {
      recipe: {
        columns: { ownerId: true },
        with: { cookbookRecipes: { with: { cookbook: { with: { members: { columns: { userId: true } } } } } } },
      },
    },
  });
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const user = await getCurrentUser();
  const allowed = canViewRecipe({
    userId: user?.id ?? null,
    recipeOwnerId: photo.recipe.ownerId,
    containingCookbooks: photo.recipe.cookbookRecipes.map((entry) => ({
      visibility: entry.cookbook.visibility,
      ownerId: entry.cookbook.ownerId,
      memberUserIds: entry.cookbook.members.map((member) => member.userId),
    })),
  });
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const object = await readRecipePhoto(key);
  if (!object) {
    // The row says this photo exists and the bucket disagrees. The visitor gets
    // the same 404 as a bad URL, but for us it means an object went missing
    // from R2 while the database still points at it.
    reportRequestError("photo.object_missing", new Error("R2 object missing for recipe photo"), request, {
      recipeId: photo.recipeId,
    });
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": photo.contentType ?? object.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
