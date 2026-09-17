import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { slugify } from "@/lib/slug";

export async function ensureDefaultCookbook(userId: string, name: string) {
  const db = getDb();
  const existing = await db.query.cookbook.findFirst({
    where: and(eq(schema.cookbook.ownerId, userId), eq(schema.cookbook.isDefault, true)),
  });
  if (existing) {
    return existing;
  }
  const slug = `${slugify(name)}-recipes-${userId.slice(-6)}`;
  const [created] = await db
    .insert(schema.cookbook)
    .values({
      ownerId: userId,
      title: "My recipes",
      description: "Private box for your recipes.",
      visibility: "private",
      slug,
      isDefault: true,
    })
    .returning();
  await db
    .insert(schema.cookbookMember)
    .values({ cookbookId: created.id, userId, role: "owner" })
    .onConflictDoNothing();
  return created;
}
