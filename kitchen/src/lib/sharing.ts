import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";

/** Everything the user shares with other people (data layer for a future sharing hub). */
export async function listOwnedSharing(userId: string) {
  const db = getDb();

  const [cookbooks, recipes] = await Promise.all([
    db.query.cookbook.findMany({
      where: eq(schema.cookbook.ownerId, userId),
      with: { members: { with: { user: true }, orderBy: [asc(schema.cookbookMember.createdAt)] } },
      orderBy: [desc(schema.cookbook.isDefault), desc(schema.cookbook.updatedAt)],
    }),
    db.query.recipe.findMany({
      where: eq(schema.recipe.ownerId, userId),
      with: { collaborators: { with: { user: true }, orderBy: [asc(schema.recipeCollaborator.createdAt)] } },
      orderBy: [desc(schema.recipe.updatedAt)],
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

  return { cookbooks, recipes, uniquePeopleCount: uniquePeople.size };
}
