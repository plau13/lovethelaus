import { getPrisma } from "@/lib/prisma";
import { getRecipeForUser } from "@/lib/recipes";

export async function isRecipeFavorited(userId: string, recipeId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const favorite = await prisma.recipeFavorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });
  return favorite != null;
}

export async function toggleRecipeFavorite(userId: string, recipeId: string): Promise<boolean> {
  const recipe = await getRecipeForUser(recipeId, userId);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }

  const prisma = await getPrisma();
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
