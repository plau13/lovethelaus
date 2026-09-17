import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { canViewCookbook } from "@/lib/permissions";

export async function isCookbookFavorited(userId: string, cookbookId: string): Promise<boolean> {
  const db = getDb();
  const favorite = await db.query.cookbookFavorite.findFirst({
    where: and(eq(schema.cookbookFavorite.userId, userId), eq(schema.cookbookFavorite.cookbookId, cookbookId)),
    columns: { id: true },
  });
  return favorite != null;
}

export async function toggleCookbookFavorite(userId: string, cookbookId: string): Promise<boolean> {
  const db = getDb();
  const cookbook = await db.query.cookbook.findFirst({
    where: eq(schema.cookbook.id, cookbookId),
    columns: { id: true, ownerId: true, visibility: true },
    with: { members: { columns: { userId: true } } },
  });
  if (!cookbook) {
    throw new Error("Cookbook not found.");
  }

  const allowed = canViewCookbook({
    userId,
    ownerId: cookbook.ownerId,
    visibility: cookbook.visibility,
    memberUserIds: cookbook.members.map((member) => member.userId),
  });
  if (!allowed) {
    throw new Error("Cookbook not found.");
  }

  const existing = await db.query.cookbookFavorite.findFirst({
    where: and(eq(schema.cookbookFavorite.userId, userId), eq(schema.cookbookFavorite.cookbookId, cookbookId)),
    columns: { id: true },
  });

  if (existing) {
    await db.delete(schema.cookbookFavorite).where(eq(schema.cookbookFavorite.id, existing.id));
    return false;
  }

  await db.insert(schema.cookbookFavorite).values({ userId, cookbookId }).onConflictDoNothing();
  return true;
}

export async function listFavoriteCookbookIds(userId: string): Promise<Set<string>> {
  const db = getDb();
  const favorites = await db.query.cookbookFavorite.findMany({
    where: eq(schema.cookbookFavorite.userId, userId),
    columns: { cookbookId: true },
  });
  return new Set(favorites.map((entry) => entry.cookbookId));
}
