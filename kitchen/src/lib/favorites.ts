import { getPrisma } from "@/lib/prisma";
import { canViewRecipe } from "@/lib/permissions";

export async function isRecipeFavorited(userId: string, recipeId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const favorite = await prisma.recipeFavorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });
  return favorite != null;
}

export async function toggleRecipeFavorite(userId: string, recipeId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      ownerId: true,
      collaborators: { where: { userId }, select: { role: true } },
      cookbookRecipes: {
        select: {
          cookbook: {
            select: {
              visibility: true,
              ownerId: true,
              members: { select: { userId: true } },
            },
          },
        },
      },
    },
  });
  if (!recipe) {
    throw new Error("Recipe not found.");
  }

  const allowed = canViewRecipe({
    userId,
    recipeOwnerId: recipe.ownerId,
    collaboratorRole: recipe.collaborators[0]?.role ?? null,
    containingCookbooks: recipe.cookbookRecipes.map((entry) => ({
      visibility: entry.cookbook.visibility,
      ownerId: entry.cookbook.ownerId,
      memberUserIds: entry.cookbook.members.map((member) => member.userId),
    })),
  });
  if (!allowed) {
    throw new Error("Recipe not found.");
  }

  const existing = await prisma.recipeFavorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  if (existing) {
    await prisma.recipeFavorite.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.recipeFavorite.create({
    data: { userId, recipeId },
  });
  return true;
}
