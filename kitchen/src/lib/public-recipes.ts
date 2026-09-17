import { and, count, desc, eq, exists, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { isIndexable, isPubliclyViewable } from "@/lib/public-seo";
import type { RecipeCategory } from "@/lib/types";

const { recipe, cookbook, cookbookRecipe, recipePhoto } = schema;

export const EXPLORE_PAGE_SIZE = 24;

/** SQL: recipe appears in at least one public cookbook. */
function inPublicCookbook() {
  const db = getDb();
  return exists(
    db
      .select({ one: sql`1` })
      .from(cookbookRecipe)
      .innerJoin(cookbook, eq(cookbook.id, cookbookRecipe.cookbookId))
      .where(and(eq(cookbookRecipe.recipeId, recipe.id), eq(cookbook.visibility, "public")))
  );
}

const cardColumns = {
  id: true,
  slug: true,
  title: true,
  category: true,
  cookMinutes: true,
  difficulty: true,
  tags: true,
  updatedAt: true,
} as const;

/** Public recipe by slug (or id as a permanent fallback). Null when no containing cookbook is public/unlisted. */
export async function getPublicRecipe(slugOrId: string) {
  const db = getDb();
  const found = await db.query.recipe.findFirst({
    where: (row, { or, eq: equals }) => or(equals(row.slug, slugOrId), equals(row.id, slugOrId)),
    with: {
      photos: { orderBy: [recipePhoto.createdAt], columns: { path: true, alt: true } },
      owner: { columns: { name: true } },
      originPerson: { columns: { name: true, relationship: true } },
      cookbookRecipes: {
        columns: { id: true },
        with: { cookbook: { columns: { id: true, slug: true, title: true, visibility: true } } },
      },
    },
  });
  if (!found) {
    return null;
  }
  const cookbooks = found.cookbookRecipes
    .map((entry) => entry.cookbook)
    .filter((entry) => entry.visibility === "public" || entry.visibility === "unlisted");
  if (!isPubliclyViewable(cookbooks)) {
    return null;
  }
  return {
    recipe: found,
    cookbooks: cookbooks.sort((a, b) => (a.visibility === "public" ? -1 : 1) - (b.visibility === "public" ? -1 : 1)),
    indexable: isIndexable(cookbooks),
  };
}

export async function listPublicRecipes(options: { category?: RecipeCategory; offset?: number; limit?: number } = {}) {
  const db = getDb();
  const { category, offset = 0, limit = EXPLORE_PAGE_SIZE } = options;
  const where = category ? and(inPublicCookbook(), eq(recipe.category, category)) : inPublicCookbook();
  const [rows, [{ total }]] = await Promise.all([
    db.query.recipe.findMany({
      where,
      columns: cardColumns,
      with: {
        photos: { orderBy: [recipePhoto.createdAt], limit: 1, columns: { path: true } },
        owner: { columns: { name: true } },
      },
      orderBy: [desc(recipe.updatedAt)],
      limit,
      offset,
    }),
    db.select({ total: count() }).from(recipe).where(where),
  ]);
  return { rows, total: Number(total) };
}

/** Every public recipe (id, slug, updatedAt) for the sitemap. */
export async function listPublicRecipeRefs() {
  const db = getDb();
  return db.query.recipe.findMany({
    where: inPublicCookbook(),
    columns: { id: true, slug: true, updatedAt: true },
    orderBy: [desc(recipe.updatedAt)],
  });
}

export async function listPublicCookbooks(limit = 12) {
  const db = getDb();
  const rows = await db.query.cookbook.findMany({
    where: eq(cookbook.visibility, "public"),
    columns: { id: true, slug: true, title: true, description: true, familyName: true, updatedAt: true },
    with: { owner: { columns: { name: true } } },
    orderBy: [desc(cookbook.updatedAt)],
    limit,
  });
  if (rows.length === 0) {
    return [];
  }
  const counts = await db
    .select({ cookbookId: cookbookRecipe.cookbookId, total: count() })
    .from(cookbookRecipe)
    .where(
      inArray(
        cookbookRecipe.cookbookId,
        rows.map((row) => row.id)
      )
    )
    .groupBy(cookbookRecipe.cookbookId);
  const totals = new Map(counts.map((row) => [row.cookbookId, Number(row.total)]));
  return rows.map((row) => ({ ...row, recipeCount: totals.get(row.id) ?? 0 }));
}
