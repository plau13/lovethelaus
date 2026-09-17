import { and, desc, asc, eq, exists, gte, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { ensureDefaultCookbook } from "@/lib/default-cookbook";
import { sendRecipeCollaboratorEmail } from "@/lib/email-templates";
import { appUrl } from "@/lib/paths";
import { canCommentOnRecipe, canEditRecipe, canViewRecipe } from "@/lib/permissions";
import { deleteRecipePhotos, uploadRecipePhoto } from "@/lib/recipe-photos";
import { recipeSlugFor } from "@/lib/slug";
import { parseTags, recipeMatchesQuery } from "@/lib/tags";
import {
  collabRoleLabel,
  cookTimeBucketFilter,
  type RecipeCategory,
  type RecipeCollabRole,
  type RecipeDifficulty,
  type RecipeType,
} from "@/lib/types";

const { recipe, recipeCollaborator, cookbookRecipe, cookbookMember, recipeRevision, recipeNote, recipePhoto, recipeFavorite, user } =
  schema;

export type ListRecipesOptions = {
  q?: string;
  cookbookId?: string;
  category?: RecipeCategory;
  timeBucket?: string;
  difficulty?: RecipeDifficulty;
};

function recipeSnapshot(entry: {
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps: string;
  recipeType: string;
  tags: string;
  servings: number | null;
  category: string | null;
  cookMinutes: number | null;
  difficulty: string | null;
}) {
  return JSON.stringify({
    title: entry.title,
    ingredients: entry.ingredients,
    steps: entry.steps,
    bakingSteps: entry.bakingSteps,
    recipeType: entry.recipeType,
    tags: entry.tags,
    servings: entry.servings,
    category: entry.category,
    cookMinutes: entry.cookMinutes,
    difficulty: entry.difficulty,
  });
}

/** SQL: the given user can see this recipe (owner, collaborator, or member of a cookbook containing it). */
function visibleToUser(userId: string): SQL {
  const db = getDb();
  const mine = eq(recipe.ownerId, userId);
  const collaborates = exists(
    db
      .select({ one: sql`1` })
      .from(recipeCollaborator)
      .where(and(eq(recipeCollaborator.recipeId, recipe.id), eq(recipeCollaborator.userId, userId)))
  );
  const viaCookbook = exists(
    db
      .select({ one: sql`1` })
      .from(cookbookRecipe)
      .innerJoin(cookbookMember, eq(cookbookMember.cookbookId, cookbookRecipe.cookbookId))
      .where(and(eq(cookbookRecipe.recipeId, recipe.id), eq(cookbookMember.userId, userId)))
  );
  return or(mine, collaborates, viaCookbook)!;
}

export async function listVisibleRecipes(userId: string, options: ListRecipesOptions = {}) {
  const db = getDb();
  const { q = "", cookbookId, category, timeBucket, difficulty } = options;
  const timeRange = timeBucket ? cookTimeBucketFilter(timeBucket) : null;

  const conditions: (SQL | undefined)[] = [visibleToUser(userId)];
  if (cookbookId) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(cookbookRecipe)
          .where(and(eq(cookbookRecipe.recipeId, recipe.id), eq(cookbookRecipe.cookbookId, cookbookId)))
      )
    );
  }
  if (category) {
    conditions.push(eq(recipe.category, category));
  }
  if (difficulty) {
    conditions.push(eq(recipe.difficulty, difficulty));
  }
  if (timeRange) {
    conditions.push(gte(recipe.cookMinutes, timeRange.min));
    if (timeRange.max !== null) {
      conditions.push(lte(recipe.cookMinutes, timeRange.max));
    }
  }

  const rows = await db.query.recipe.findMany({
    where: and(...conditions),
    with: { photos: true, cookbookRecipes: { with: { cookbook: true } } },
    orderBy: [desc(recipe.updatedAt)],
  });
  return rows.filter((entry) => recipeMatchesQuery(entry, q));
}

export async function listRecentRecipes(userId: string, limit = 5) {
  const db = getDb();
  return db.query.recipe.findMany({
    where: visibleToUser(userId),
    with: { photos: true, cookbookRecipes: { with: { cookbook: true } } },
    orderBy: [desc(recipe.updatedAt)],
    limit,
  });
}

const accessContext = {
  cookbookRecipes: { with: { cookbook: { with: { members: true } } } },
} as const;

export async function getRecipeForUser(recipeId: string, userId: string | null) {
  const db = getDb();
  const found = await db.query.recipe.findFirst({
    where: eq(recipe.id, recipeId),
    with: {
      photos: { orderBy: [asc(recipePhoto.createdAt)] },
      notes: { with: { user: true }, orderBy: [asc(recipeNote.createdAt)] },
      owner: true,
      collaborators: { with: { user: true } },
      revisions: { with: { editor: true }, orderBy: [desc(recipeRevision.createdAt)], limit: 20 },
      ...accessContext,
      ...(userId ? { favorites: { where: eq(recipeFavorite.userId, userId), columns: { id: true }, limit: 1 } } : {}),
    },
  });
  if (!found) {
    return null;
  }
  const { favorites, ...recipeData } = found as typeof found & { favorites?: { id: string }[] };
  const favorited = Boolean(userId && favorites && favorites.length > 0);
  const collaboratorRole =
    userId != null ? (recipeData.collaborators.find((entry) => entry.userId === userId)?.role ?? null) : null;
  const allowed = canViewRecipe({
    userId,
    recipeOwnerId: recipeData.ownerId,
    collaboratorRole,
    containingCookbooks: recipeData.cookbookRecipes.map((entry) => ({
      visibility: entry.cookbook.visibility,
      ownerId: entry.cookbook.ownerId,
      memberUserIds: entry.cookbook.members.map((member) => member.userId),
    })),
  });
  if (!allowed) {
    return null;
  }
  return { ...recipeData, collaboratorRole, favorited };
}

export async function createRecipe(args: {
  userId: string;
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps?: string;
  recipeType?: RecipeType;
  tags: string;
  servings: number | null;
  category?: RecipeCategory | null;
  cookMinutes?: number | null;
  difficulty?: RecipeDifficulty | null;
  sourceType: string;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  photo?: File | null;
}) {
  const db = getDb();
  const title = args.title.trim();
  if (!title) {
    throw new Error("Give the recipe a name.");
  }
  const cookbook = await ensureDefaultCookbook(args.userId, "My recipes");
  const [created] = await db
    .insert(recipe)
    .values({
      ownerId: args.userId,
      title,
      ingredients: args.ingredients.trim(),
      steps: args.steps.trim(),
      bakingSteps: (args.bakingSteps ?? "").trim(),
      recipeType: args.recipeType ?? "cooking",
      tags: parseTags(args.tags).join(", "),
      servings: args.servings,
      category: args.category ?? null,
      cookMinutes: args.cookMinutes ?? null,
      difficulty: args.difficulty ?? null,
      sourceType: args.sourceType,
      sourceUrl: args.sourceUrl,
      sourceAttribution: args.sourceAttribution,
    })
    .returning();
  await db.update(recipe).set({ slug: recipeSlugFor(title, created.id) }).where(eq(recipe.id, created.id));
  await db
    .insert(cookbookRecipe)
    .values({ cookbookId: cookbook.id, recipeId: created.id, position: 0 })
    .onConflictDoNothing();
  if (args.photo && args.photo.size > 0) {
    await saveRecipePhoto(created.id, args.photo);
  }
  return { ...created, slug: recipeSlugFor(title, created.id) };
}

/** Give recipes without a public slug one (used when a cookbook becomes shareable). */
export async function ensureRecipeSlugs(recipeIds: string[]): Promise<void> {
  if (recipeIds.length === 0) {
    return;
  }
  const db = getDb();
  const rows = await db.query.recipe.findMany({
    where: and(inArray(recipe.id, recipeIds), isNull(recipe.slug)),
    columns: { id: true, title: true },
  });
  for (const row of rows) {
    await db.update(recipe).set({ slug: recipeSlugFor(row.title, row.id) }).where(eq(recipe.id, row.id));
  }
}

export async function updateRecipe(args: {
  userId: string;
  recipeId: string;
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps: string;
  recipeType: RecipeType;
  tags: string;
  servings: number | null;
  category?: RecipeCategory | null;
  cookMinutes?: number | null;
  difficulty?: RecipeDifficulty | null;
  photo?: File | null;
}) {
  const db = getDb();
  const existing = await db.query.recipe.findFirst({
    where: eq(recipe.id, args.recipeId),
    with: { collaborators: { where: eq(recipeCollaborator.userId, args.userId) } },
  });
  if (
    !existing ||
    !canEditRecipe({
      userId: args.userId,
      recipeOwnerId: existing.ownerId,
      collaboratorRole: existing.collaborators[0]?.role ?? null,
    })
  ) {
    throw new Error("You do not have edit access to this recipe.");
  }

  await db.insert(recipeRevision).values({
    recipeId: existing.id,
    editorId: args.userId,
    snapshot: recipeSnapshot(existing),
  });

  await db
    .update(recipe)
    .set({
      title: args.title.trim(),
      ingredients: args.ingredients.trim(),
      steps: args.steps.trim(),
      bakingSteps: args.bakingSteps.trim(),
      recipeType: args.recipeType,
      tags: parseTags(args.tags).join(", "),
      servings: args.servings,
      category: args.category ?? null,
      cookMinutes: args.cookMinutes ?? null,
      difficulty: args.difficulty ?? null,
      ...(existing.slug ? {} : { slug: recipeSlugFor(args.title, existing.id) }),
    })
    .where(eq(recipe.id, args.recipeId));
  if (args.photo && args.photo.size > 0) {
    await saveRecipePhoto(args.recipeId, args.photo);
  }
}

/** Owner-only. Removes R2 objects first, then the row (cascades handle the rest). */
export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
  const db = getDb();
  const existing = await db.query.recipe.findFirst({
    where: eq(recipe.id, recipeId),
    columns: { id: true, ownerId: true },
    with: { photos: { columns: { path: true } } },
  });
  if (!existing || existing.ownerId !== userId) {
    throw new Error("Only the recipe owner can delete it.");
  }
  await deleteRecipePhotos(existing.photos.map((photo) => photo.path));
  await db.delete(recipe).where(eq(recipe.id, recipeId));
}

export async function setRecipeCollaborator(args: {
  actorId: string;
  recipeId: string;
  email: string;
  role: RecipeCollabRole;
}) {
  const db = getDb();
  const target = await db.query.recipe.findFirst({
    where: eq(recipe.id, args.recipeId),
    with: { collaborators: { where: eq(recipeCollaborator.userId, args.actorId) }, owner: true },
  });
  const collaboratorRole = target?.collaborators[0]?.role ?? null;
  const canInvite =
    target != null &&
    (target.ownerId === args.actorId || collaboratorRole === "edit" || collaboratorRole === "co-author");
  if (!target || !canInvite) {
    throw new Error("You do not have permission to invite others to this recipe.");
  }
  const email = args.email.trim().toLowerCase();
  const invitee = await db.query.user.findFirst({ where: eq(user.email, email), columns: { id: true, email: true } });
  if (!invitee) {
    throw new Error("No Kitchen account for that email yet. Ask them to sign up first.");
  }
  if (invitee.id === target.ownerId) {
    throw new Error("You already own this recipe.");
  }
  await db
    .insert(recipeCollaborator)
    .values({ recipeId: args.recipeId, userId: invitee.id, role: args.role })
    .onConflictDoUpdate({
      target: [recipeCollaborator.recipeId, recipeCollaborator.userId],
      set: { role: args.role },
    });
  const actor = await db.query.user.findFirst({ where: eq(user.id, args.actorId), columns: { name: true } });
  await sendRecipeCollaboratorEmail({
    to: invitee.email,
    inviterName: actor?.name ?? target.owner.name,
    recipeTitle: target.title,
    role: collabRoleLabel(args.role).toLowerCase(),
    url: appUrl(`/recipes/${target.id}`),
  });
}

export async function removeRecipeCollaborator(args: { ownerId: string; recipeId: string; userId: string }) {
  const db = getDb();
  const target = await db.query.recipe.findFirst({ where: eq(recipe.id, args.recipeId), columns: { ownerId: true } });
  if (!target || target.ownerId !== args.ownerId) {
    throw new Error("Only the recipe owner can manage access.");
  }
  await db
    .delete(recipeCollaborator)
    .where(and(eq(recipeCollaborator.recipeId, args.recipeId), eq(recipeCollaborator.userId, args.userId)));
}

export async function copyRecipeToMyBook(userId: string, recipeId: string) {
  const source = await getRecipeForUser(recipeId, userId);
  if (!source) {
    throw new Error("Recipe not found.");
  }
  return createRecipe({
    userId,
    title: source.title,
    ingredients: source.ingredients,
    steps: source.steps,
    bakingSteps: source.bakingSteps,
    recipeType: source.recipeType as RecipeType,
    tags: source.tags,
    servings: source.servings,
    category: source.category as RecipeCategory | null,
    cookMinutes: source.cookMinutes,
    difficulty: source.difficulty as RecipeDifficulty | null,
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    sourceAttribution: source.sourceAttribution ?? `Copied from ${source.owner.name}`,
  });
}

export async function addNote(userId: string, recipeId: string, body: string) {
  const db = getDb();
  const target = await getRecipeForUser(recipeId, userId);
  if (!target) {
    throw new Error("Recipe not found.");
  }
  const canComment = canCommentOnRecipe({
    userId,
    recipeOwnerId: target.ownerId,
    collaboratorRole: target.collaboratorRole ?? null,
    canView: true,
  });
  if (!canComment) {
    throw new Error("You do not have comment access on this recipe.");
  }
  const text = body.trim();
  if (!text) {
    throw new Error("Write a note first.");
  }
  const [note] = await db.insert(recipeNote).values({ userId, recipeId, body: text }).returning();
  return note;
}

async function saveRecipePhoto(recipeId: string, photo: File) {
  const db = getDb();
  const { key, contentType } = await uploadRecipePhoto(recipeId, photo);
  await db.insert(recipePhoto).values({ recipeId, path: key, contentType, alt: "Finished dish" });
}
