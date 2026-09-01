import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { parseTags, recipeMatchesQuery } from "@/lib/tags";
import { canEditRecipe, canViewRecipe } from "@/lib/permissions";
import { ensureDefaultCookbook } from "@/lib/auth";
import type { RecipeType } from "@/lib/types";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ListRecipesOptions = {
  q?: string;
  cookbookId?: string;
};

export async function listVisibleRecipes(userId: string, options: ListRecipesOptions = {}) {
  const { q = "", cookbookId } = options;
  const recipes = await prisma.recipe.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: userId },
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
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      photos: true,
      notes: { include: { user: true }, orderBy: { createdAt: "asc" } },
      owner: true,
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
  const allowed = canViewRecipe({
    userId,
    recipeOwnerId: recipe.ownerId,
    containingCookbooks: recipe.cookbookRecipes.map((entry) => ({
      visibility: entry.cookbook.visibility,
      ownerId: entry.cookbook.ownerId,
      memberUserIds: entry.cookbook.members.map((member) => member.userId),
    })),
  });
  if (!allowed) {
    return null;
  }
  return recipe;
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
  sourceType: string;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  photo?: File | null;
}) {
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
  photo?: File | null;
}) {
  const recipe = await prisma.recipe.findUnique({ where: { id: args.recipeId } });
  if (!recipe || !canEditRecipe({ userId: args.userId, recipeOwnerId: recipe.ownerId })) {
    throw new Error("You can only edit recipes you own. Add a note instead.");
  }
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
    },
  });
  if (args.photo && args.photo.size > 0) {
    await saveRecipePhoto(args.recipeId, args.photo);
  }
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
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    sourceAttribution: source.sourceAttribution ?? `Copied from ${source.owner.name}`,
  });
}

export async function addNote(userId: string, recipeId: string, body: string) {
  const recipe = await getRecipeForUser(recipeId, userId);
  if (!recipe) {
    throw new Error("Recipe not found.");
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
  await prisma.recipePhoto.create({
    data: {
      recipeId,
      path: `/uploads/${filename}`,
      alt: "Finished dish",
    },
  });
}
