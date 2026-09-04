import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { getPrisma } from "@/lib/prisma";
import { uploadRecipePhoto } from "@/lib/recipe-photos";
import { parseTags, recipeMatchesQuery } from "@/lib/tags";
import {
  canCommentOnRecipe,
  canEditRecipe,
  canViewRecipe,
} from "@/lib/permissions";
import { ensureDefaultCookbook } from "@/lib/auth";
import { cookTimeBucketFilter, type RecipeCategory, type RecipeCollabRole, type RecipeDifficulty, type RecipeType } from "@/lib/types";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ListRecipesOptions = {
  q?: string;
  cookbookId?: string;
  category?: RecipeCategory;
  timeBucket?: string;
  difficulty?: RecipeDifficulty;
};

function recipeSnapshot(recipe: {
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
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    bakingSteps: recipe.bakingSteps,
    recipeType: recipe.recipeType,
    tags: recipe.tags,
    servings: recipe.servings,
    category: recipe.category,
    cookMinutes: recipe.cookMinutes,
    difficulty: recipe.difficulty,
  });
}

export async function listVisibleRecipes(userId: string, options: ListRecipesOptions = {}) {
  const prisma = await getPrisma();
  const { q = "", cookbookId, category, timeBucket, difficulty } = options;
  const timeFilter = timeBucket ? cookTimeBucketFilter(timeBucket) : null;
  const recipes = await prisma.recipe.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { userId } } },
            {
              cookbookRecipes: {
                some: {
                  cookbook: {
                    members: { some: { userId } },
                  },
                },
              },
            },
          ],
        },
        cookbookId
          ? {
              cookbookRecipes: {
                some: { cookbookId },
              },
            }
          : {},
        category ? { category } : {},
        difficulty ? { difficulty } : {},
        timeFilter ?? {},
      ],
    },
    include: { photos: true, cookbookRecipes: { include: { cookbook: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return recipes.filter((recipe) => recipeMatchesQuery(recipe, q));
}

export async function listRecentRecipes(userId: string, limit = 5) {
  return listVisibleRecipes(userId, {}).then((recipes) => recipes.slice(0, limit));
}

export async function getRecipeForUser(recipeId: string, userId: string | null) {
  const prisma = await getPrisma();
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      photos: true,
      notes: { include: { user: true }, orderBy: { createdAt: "asc" } },
      owner: true,
      collaborators: { include: { user: true } },
      revisions: {
        include: { editor: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      cookbookRecipes: {
        include: {
          cookbook: { include: { members: true } },
        },
      },
    },
  });
  if (!recipe) {
    return null;
  }
  const collaboratorRole =
    userId != null
      ? (recipe.collaborators.find((entry) => entry.userId === userId)?.role ?? null)
      : null;
  const allowed = canViewRecipe({
    userId,
    recipeOwnerId: recipe.ownerId,
    collaboratorRole,
    containingCookbooks: recipe.cookbookRecipes.map((entry) => ({
      visibility: entry.cookbook.visibility,
      ownerId: entry.cookbook.ownerId,
      memberUserIds: entry.cookbook.members.map((member) => member.userId),
    })),
  });
  if (!allowed) {
    return null;
  }
  return { ...recipe, collaboratorRole };
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
  const prisma = await getPrisma();
  const title = args.title.trim();
  if (!title) {
    throw new Error("Give the recipe a name.");
  }
  const cookbook = await ensureDefaultCookbook(args.userId, "My recipes");
  const recipe = await prisma.recipe.create({
    data: {
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
      cookbookRecipes: {
        create: { cookbookId: cookbook.id, position: 0 },
      },
    },
  });
  if (args.photo && args.photo.size > 0) {
    await saveRecipePhoto(recipe.id, args.photo);
  }
  return recipe;
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
  const prisma = await getPrisma();
  const recipe = await prisma.recipe.findUnique({
    where: { id: args.recipeId },
    include: { collaborators: { where: { userId: args.userId } } },
  });
  if (
    !recipe ||
    !canEditRecipe({
      userId: args.userId,
      recipeOwnerId: recipe.ownerId,
      collaboratorRole: recipe.collaborators[0]?.role ?? null,
    })
  ) {
    throw new Error("You do not have edit access to this recipe.");
  }

  await prisma.recipeRevision.create({
    data: {
      recipeId: recipe.id,
      editorId: args.userId,
      snapshot: recipeSnapshot(recipe),
    },
  });

  await prisma.recipe.update({
    where: { id: args.recipeId },
    data: {
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
    },
  });
  if (args.photo && args.photo.size > 0) {
    await saveRecipePhoto(args.recipeId, args.photo);
  }
}

export async function setRecipeCollaborator(args: {
  actorId: string;
  recipeId: string;
  email: string;
  role: RecipeCollabRole;
}) {
  const prisma = await getPrisma();
  const recipe = await prisma.recipe.findUnique({
    where: { id: args.recipeId },
    include: { collaborators: { where: { userId: args.actorId } } },
  });
  const collaboratorRole = recipe?.collaborators[0]?.role ?? null;
  const canInvite =
    recipe != null &&
    (recipe.ownerId === args.actorId ||
      collaboratorRole === "edit" ||
      collaboratorRole === "co-author");
  if (!canInvite) {
    throw new Error("You do not have permission to invite others to this recipe.");
  }
  const email = args.email.trim().toLowerCase();
  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) {
    throw new Error("No Kitchen account for that email yet. Ask them to sign up first.");
  }
  if (invitee.id === recipe.ownerId) {
    throw new Error("You already own this recipe.");
  }
  await prisma.recipeCollaborator.upsert({
    where: { recipeId_userId: { recipeId: args.recipeId, userId: invitee.id } },
    update: { role: args.role },
    create: { recipeId: args.recipeId, userId: invitee.id, role: args.role },
  });
}

export async function removeRecipeCollaborator(args: {
  ownerId: string;
  recipeId: string;
  userId: string;
}) {
  const prisma = await getPrisma();
  const recipe = await prisma.recipe.findUnique({ where: { id: args.recipeId } });
  if (!recipe || recipe.ownerId !== args.ownerId) {
    throw new Error("Only the recipe owner can manage access.");
  }
  await prisma.recipeCollaborator.deleteMany({
    where: { recipeId: args.recipeId, userId: args.userId },
  });
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
  const prisma = await getPrisma();
  const recipe = await getRecipeForUser(recipeId, userId);
  if (!recipe) {
    throw new Error("Recipe not found.");
  }
  const canComment = canCommentOnRecipe({
    userId,
    recipeOwnerId: recipe.ownerId,
    collaboratorRole: recipe.collaboratorRole ?? null,
    canView: true,
  });
  if (!canComment) {
    throw new Error("You do not have comment access on this recipe.");
  }
  const text = body.trim();
  if (!text) {
    throw new Error("Write a note first.");
  }
  return prisma.recipeNote.create({
    data: { userId, recipeId, body: text },
  });
}

async function saveRecipePhoto(recipeId: string, photo: File) {
  const prisma = await getPrisma();
  let photoPath: string;

  try {
    photoPath = await uploadRecipePhoto(recipeId, photo);
  } catch {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) {
      throw new Error("Use a JPG, PNG, or WebP photo.");
    }
    if (photo.size > 1 * 1024 * 1024) {
      throw new Error("Photos need to be under 1MB.");
    }
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomBytes(8).toString("hex")}.${ext}`;
    const buffer = Buffer.from(await photo.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    photoPath = `/uploads/${filename}`;
  }

  await prisma.recipePhoto.create({
    data: {
      recipeId,
      path: photoPath,
      alt: "Finished dish",
    },
  });
}
