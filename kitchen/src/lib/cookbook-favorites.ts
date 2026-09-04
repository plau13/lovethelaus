import { getPrisma } from "@/lib/prisma";
import { canViewCookbook } from "@/lib/permissions";

export async function isCookbookFavorited(userId: string, cookbookId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const favorite = await prisma.cookbookFavorite.findUnique({
    where: { userId_cookbookId: { userId, cookbookId } },
  });
  return favorite != null;
}

export async function toggleCookbookFavorite(userId: string, cookbookId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const cookbook = await prisma.cookbook.findUnique({
    where: { id: cookbookId },
    select: {
      id: true,
      ownerId: true,
      visibility: true,
      members: { select: { userId: true } },
    },
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

  const existing = await prisma.cookbookFavorite.findUnique({
    where: { userId_cookbookId: { userId, cookbookId } },
  });

  if (existing) {
    await prisma.cookbookFavorite.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.cookbookFavorite.create({
    data: { userId, cookbookId },
  });
  return true;
}

export async function listFavoriteCookbookIds(userId: string): Promise<Set<string>> {
  const prisma = await getPrisma();
  const favorites = await prisma.cookbookFavorite.findMany({
    where: { userId },
    select: { cookbookId: true },
  });
  return new Set(favorites.map((entry) => entry.cookbookId));
}
