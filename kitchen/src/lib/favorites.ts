import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { canViewRecipe } from "@/lib/permissions";

export async function isRecipeFavorited(userId: string, recipeId: string): Promise<boolean> {
  const db = getDb();
  const favorite = await db.query.recipeFavorite.findFirst({
    where: and(eq(schema.recipeFavorite.userId, userId), eq(schema.recipeFavorite.recipeId, recipeId)),
    columns: { id: true },
  });
  return favorite != null;
}

export async function toggleRecipeFavorite(userId: string, recipeId: string): Promise<boolean> {
  const db = getDb();
  const recipe = await db.query.recipe.findFirst({
    where: eq(schema.recipe.id, recipeId),
    columns: { id: true, ownerId: true },
    with: {
      collaborators: { where: eq(schema.recipeCollaborator.userId, userId), columns: { role: true } },
      cookbookRecipes: {
        columns: { id: true },
        with: {
          cookbook: {
            columns: { visibility: true, ownerId: true },
            with: { members: { columns: { userId: true } } },
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

  const existing = await db.query.recipeFavorite.findFirst({
    where: and(eq(schema.recipeFavorite.userId, userId), eq(schema.recipeFavorite.recipeId, recipeId)),
    columns: { id: true },
  });

  if (existing) {
    await db.delete(schema.recipeFavorite).where(eq(schema.recipeFavorite.id, existing.id));
    return false;
  }

  await db.insert(schema.recipeFavorite).values({ userId, recipeId }).onConflictDoNothing();
  return true;
}
