import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { readRecipePhoto } from "@/lib/recipe-photos";
import { canViewRecipe } from "@/lib/permissions";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");
  const path = `/kitchen/api/recipe-photos/${key}`;

  const prisma = await getPrisma();
  const photo = await prisma.recipePhoto.findFirst({ where: { path } });
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: photo.recipeId },
    include: {
      cookbookRecipes: {
        include: { cookbook: { include: { members: true } } },
      },
    },
  });
  if (!recipe) {
    return new Response("Not found", { status: 404 });
  }

  const user = await getCurrentUser();
  const allowed = canViewRecipe({
    userId: user?.id ?? null,
    recipeOwnerId: recipe.ownerId,
    containingCookbooks: recipe.cookbookRecipes.map((entry) => ({
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
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
