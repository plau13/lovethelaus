import { and, eq, exists, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { canViewRecipe } from "@/lib/permissions";
import { isSubscriber } from "@/lib/subscription";
import { buildExportPayload, type RecipeForExport } from "@/lib/export";

const { recipe, recipeCollaborator, cookbookRecipe, cookbookMember, cookbook, user } = schema;

export type ExportRecipeAccess = {
  allowed: boolean;
  reason: "owner" | "subscriber" | "denied";
};

export function exportAccessFromLoadedRecipe(
  current: { id: string; subscriptionTier: string },
  target: { ownerId: string }
): ExportRecipeAccess {
  if (target.ownerId === current.id) {
    return { allowed: true, reason: "owner" };
  }
  if (!isSubscriber(current)) {
    return { allowed: false, reason: "denied" };
  }
  return { allowed: true, reason: "subscriber" };
}

type LoadedRecipe = {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  servings: number | null;
  tags: string;
  sourceType: string;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  updatedAt: Date;
  notes: Array<{ body: string }>;
};

function toRecipeForExport(entry: LoadedRecipe): RecipeForExport {
  return {
    id: entry.id,
    title: entry.title,
    ingredients: entry.ingredients,
    steps: entry.steps,
    servings: entry.servings,
    tags: entry.tags,
    sourceType: entry.sourceType,
    sourceUrl: entry.sourceUrl,
    sourceAttribution: entry.sourceAttribution,
    updatedAt: entry.updatedAt,
    notes: entry.notes.map((note) => ({ body: note.body })),
  };
}

const accessContext = {
  cookbookRecipes: { with: { cookbook: { with: { members: { columns: { userId: true } } } } } },
} as const;

type AccessRow = {
  ownerId: string;
  collaborators?: { role: string }[];
  cookbookRecipes: { cookbook: { visibility: string; ownerId: string; members: { userId: string }[] } }[];
};

function viewAllowed(userId: string, row: AccessRow): boolean {
  return canViewRecipe({
    userId,
    recipeOwnerId: row.ownerId,
    collaboratorRole: row.collaborators?.[0]?.role ?? null,
    containingCookbooks: row.cookbookRecipes.map((entry) => ({
      visibility: entry.cookbook.visibility,
      ownerId: entry.cookbook.ownerId,
      memberUserIds: entry.cookbook.members.map((member) => member.userId),
    })),
  });
}

export async function canExportRecipe(userId: string, recipeId: string): Promise<ExportRecipeAccess> {
  const db = getDb();
  const current = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { subscriptionTier: true } });
  if (!current) {
    return { allowed: false, reason: "denied" };
  }

  const target = await db.query.recipe.findFirst({
    where: eq(recipe.id, recipeId),
    with: {
      collaborators: { where: eq(recipeCollaborator.userId, userId), columns: { role: true } },
      ...accessContext,
    },
  });
  if (!target) {
    return { allowed: false, reason: "denied" };
  }
  if (target.ownerId === userId) {
    return { allowed: true, reason: "owner" };
  }
  if (!isSubscriber(current)) {
    return { allowed: false, reason: "denied" };
  }
  if (!viewAllowed(userId, target)) {
    return { allowed: false, reason: "denied" };
  }
  return { allowed: true, reason: "subscriber" };
}

export async function buildSingleRecipeExport(userId: string, recipeId: string) {
  const access = await canExportRecipe(userId, recipeId);
  if (!access.allowed) {
    throw new Error("You cannot export this recipe.");
  }
  const db = getDb();
  const target = await db.query.recipe.findFirst({ where: eq(recipe.id, recipeId), with: { notes: true } });
  if (!target) {
    throw new Error("Recipe not found.");
  }
  return buildExportPayload([toRecipeForExport(target)]);
}

export async function canExportCookbook(userId: string, cookbookId: string): Promise<boolean> {
  const db = getDb();
  const target = await db.query.cookbook.findFirst({
    where: eq(cookbook.id, cookbookId),
    columns: { ownerId: true },
    with: { members: { where: eq(cookbookMember.userId, userId), columns: { role: true } } },
  });
  if (!target) {
    return false;
  }
  const role = target.members[0]?.role ?? null;
  return target.ownerId === userId || role === "editor" || role === "owner";
}

export async function buildCookbookExport(userId: string, cookbookId: string) {
  const allowed = await canExportCookbook(userId, cookbookId);
  if (!allowed) {
    throw new Error("You cannot export this cookbook.");
  }
  const db = getDb();
  const entries = await db.query.cookbookRecipe.findMany({
    where: eq(cookbookRecipe.cookbookId, cookbookId),
    with: { recipe: { with: { notes: true } } },
    orderBy: (row, { asc }) => [asc(row.position)],
  });
  return buildExportPayload(entries.map((entry) => toRecipeForExport(entry.recipe)));
}

export async function recipesForExport(userId: string): Promise<RecipeForExport[]> {
  const db = getDb();
  const current = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { subscriptionTier: true } });
  if (!current) {
    return [];
  }

  const owned = await db.query.recipe.findMany({
    where: eq(recipe.ownerId, userId),
    with: { notes: true },
    orderBy: (row, { asc }) => [asc(row.title)],
  });
  const ownedIds = new Set(owned.map((entry) => entry.id));
  const exportable: RecipeForExport[] = owned.map(toRecipeForExport);

  if (!isSubscriber(current)) {
    return exportable;
  }

  const collabRecipes = await db.query.recipe.findMany({
    where: and(
      ne(recipe.ownerId, userId),
      exists(
        db
          .select({ one: sql`1` })
          .from(recipeCollaborator)
          .where(and(eq(recipeCollaborator.recipeId, recipe.id), eq(recipeCollaborator.userId, userId)))
      )
    ),
    with: {
      notes: true,
      collaborators: { where: eq(recipeCollaborator.userId, userId), columns: { role: true } },
      ...accessContext,
    },
  });
  for (const entry of collabRecipes) {
    if (ownedIds.has(entry.id)) continue;
    if (viewAllowed(userId, entry)) {
      exportable.push(toRecipeForExport(entry));
    }
  }

  const sharedCookbookRecipes = await db.query.recipe.findMany({
    where: and(
      ne(recipe.ownerId, userId),
      exists(
        db
          .select({ one: sql`1` })
          .from(cookbookRecipe)
          .innerJoin(cookbookMember, eq(cookbookMember.cookbookId, cookbookRecipe.cookbookId))
          .where(and(eq(cookbookRecipe.recipeId, recipe.id), eq(cookbookMember.userId, userId)))
      )
    ),
    with: { notes: true, ...accessContext },
  });
  for (const entry of sharedCookbookRecipes) {
    if (ownedIds.has(entry.id) || exportable.some((existing) => existing.id === entry.id)) continue;
    if (viewAllowed(userId, entry)) {
      exportable.push(toRecipeForExport(entry));
    }
  }

  return exportable;
}

export async function buildUserExportPayload(userId: string) {
  const recipes = await recipesForExport(userId);
  return buildExportPayload(recipes);
}

export function exportSummary(current: { subscriptionTier: string }, recipeCount: number, ownedCount: number) {
  if (isSubscriber(current)) {
    return `Export ${recipeCount} recipe${recipeCount === 1 ? "" : "s"} (yours plus shared recipes you can access).`;
  }
  return `Export ${ownedCount} recipe${ownedCount === 1 ? "" : "s"} you own. Subscribe to export shared recipes too.`;
}
