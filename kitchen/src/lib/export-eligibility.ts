import { getPrisma } from "@/lib/prisma";
import { canViewRecipe } from "@/lib/permissions";
import { isSubscriber } from "@/lib/subscription";
import { buildExportPayload, toRecipeExport, type RecipeForExport } from "@/lib/export";

export async function recipesForExport(userId: string): Promise<RecipeForExport[]> {
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return [];
  }

  const owned = await prisma.recipe.findMany({
    where: { ownerId: userId },
    include: { notes: true },
    orderBy: { title: "asc" },
  });

  const ownedIds = new Set(owned.map((r) => r.id));
  const exportable: RecipeForExport[] = owned.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    servings: recipe.servings,
    tags: recipe.tags,
    sourceType: recipe.sourceType,
    sourceUrl: recipe.sourceUrl,
    sourceAttribution: recipe.sourceAttribution,
    updatedAt: recipe.updatedAt,
    notes: recipe.notes.map((n) => ({ body: n.body })),
  }));

  if (!isSubscriber(user)) {
    return exportable;
  }

  const collabRecipes = await prisma.recipe.findMany({
    where: {
      collaborators: { some: { userId } },
      ownerId: { not: userId },
    },
    include: {
      notes: true,
      collaborators: { where: { userId } },
      cookbookRecipes: { include: { cookbook: { include: { members: true } } } },
    },
  });

  for (const recipe of collabRecipes) {
    if (ownedIds.has(recipe.id)) continue;
    const allowed = canViewRecipe({
      userId,
      recipeOwnerId: recipe.ownerId,
      collaboratorRole: recipe.collaborators[0]?.role ?? null,
      containingCookbooks: recipe.cookbookRecipes.map((entry) => ({
        visibility: entry.cookbook.visibility,
        ownerId: entry.cookbook.ownerId,
        memberUserIds: entry.cookbook.members.map((m) => m.userId),
      })),
    });
    if (allowed) {
      exportable.push({
        id: recipe.id,
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        servings: recipe.servings,
        tags: recipe.tags,
        sourceType: recipe.sourceType,
        sourceUrl: recipe.sourceUrl,
        sourceAttribution: recipe.sourceAttribution,
        updatedAt: recipe.updatedAt,
        notes: recipe.notes.map((n) => ({ body: n.body })),
      });
    }
  }

  const sharedCookbookRecipes = await prisma.recipe.findMany({
    where: {
      ownerId: { not: userId },
      cookbookRecipes: {
        some: {
          cookbook: { members: { some: { userId } } },
        },
      },
    },
    include: {
      notes: true,
      cookbookRecipes: { include: { cookbook: { include: { members: true } } } },
    },
  });

  for (const recipe of sharedCookbookRecipes) {
    if (ownedIds.has(recipe.id) || exportable.some((r) => r.id === recipe.id)) continue;
    const allowed = canViewRecipe({
      userId,
      recipeOwnerId: recipe.ownerId,
      containingCookbooks: recipe.cookbookRecipes.map((entry) => ({
        visibility: entry.cookbook.visibility,
        ownerId: entry.cookbook.ownerId,
        memberUserIds: entry.cookbook.members.map((m) => m.userId),
      })),
    });
    if (allowed) {
      exportable.push({
        id: recipe.id,
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        servings: recipe.servings,
        tags: recipe.tags,
        sourceType: recipe.sourceType,
        sourceUrl: recipe.sourceUrl,
        sourceAttribution: recipe.sourceAttribution,
        updatedAt: recipe.updatedAt,
        notes: recipe.notes.map((n) => ({ body: n.body })),
      });
    }
  }

  return exportable;
}

export async function buildUserExportPayload(userId: string) {
  const recipes = await recipesForExport(userId);
  return buildExportPayload(recipes);
}

export function exportSummary(user: { subscriptionTier: string }, recipeCount: number, ownedCount: number) {
  if (isSubscriber(user)) {
    return `Export ${recipeCount} recipe${recipeCount === 1 ? "" : "s"} (yours plus shared recipes you can access).`;
  }
  return `Export ${ownedCount} recipe${ownedCount === 1 ? "" : "s"} you own. Subscribe to export shared recipes too.`;
}
