import { getPrisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function ensureDefaultCookbook(userId: string, name: string) {
  const prisma = await getPrisma();
  const existing = await prisma.cookbook.findFirst({
    where: { ownerId: userId, isDefault: true },
  });
  if (existing) {
    return existing;
  }
  const slug = `${slugify(name)}-recipes-${userId.slice(-6)}`;
  return prisma.cookbook.create({
    data: {
      ownerId: userId,
      title: "My recipes",
      description: "Private box for your recipes.",
      visibility: "private",
      slug,
      isDefault: true,
      members: { create: { userId, role: "owner" } },
    },
  });
}
