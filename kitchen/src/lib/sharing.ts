import { getPrisma } from "@/lib/prisma";

export async function listOwnedSharing(userId: string) {
  const prisma = await getPrisma();

  const [cookbooks, recipes] = await Promise.all([
    prisma.cookbook.findMany({
      where: { ownerId: userId },
      include: {
        members: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.recipe.findMany({
      where: { ownerId: userId },
      include: {
        collaborators: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const uniquePeople = new Set<string>();
  for (const cookbook of cookbooks) {
    for (const member of cookbook.members) {
      if (member.userId !== userId) {
        uniquePeople.add(member.userId);
      }
    }
  }
  for (const recipe of recipes) {
    for (const collaborator of recipe.collaborators) {
      uniquePeople.add(collaborator.userId);
    }
  }

  return {
    cookbooks,
    recipes,
    uniquePeopleCount: uniquePeople.size,
  };
}
