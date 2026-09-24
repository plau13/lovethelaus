import { and, desc, eq, exists, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { getRecipeForUser } from "@/lib/recipes";

const { recipeMemory, recipe, person, recipeCollaborator, cookbookRecipe, cookbookMember } = schema;

export const MAX_MEMORY_NOTE = 500;

function parseMadeOn(raw: string | null | undefined): Date {
  if (!raw) {
    return new Date();
  }
  const parsed = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Pick a real date.");
  }
  if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    throw new Error("That date is in the future.");
  }
  return parsed;
}

/** "I made this": anyone who can view the recipe can record a memory. */
export async function addMemory(args: { userId: string; recipeId: string; madeOn?: string | null; note?: string | null }) {
  const target = await getRecipeForUser(args.recipeId, args.userId);
  if (!target) {
    throw new Error("Recipe not found.");
  }
  const note = (args.note ?? "").trim().slice(0, MAX_MEMORY_NOTE);
  const db = getDb();
  const [created] = await db
    .insert(recipeMemory)
    .values({ recipeId: args.recipeId, userId: args.userId, madeOn: parseMadeOn(args.madeOn), note })
    .returning();
  return created;
}

export async function deleteMemory(id: string, userId: string) {
  const db = getDb();
  const removed = await db
    .delete(recipeMemory)
    .where(and(eq(recipeMemory.id, id), eq(recipeMemory.userId, userId)))
    .returning({ id: recipeMemory.id });
  if (removed.length === 0) {
    throw new Error("Only the person who recorded this can remove it.");
  }
}

export async function listRecipeMemories(recipeId: string, limit = 20) {
  const db = getDb();
  return db.query.recipeMemory.findMany({
    where: eq(recipeMemory.recipeId, recipeId),
    with: { user: { columns: { id: true, name: true } } },
    orderBy: [desc(recipeMemory.madeOn), desc(recipeMemory.createdAt)],
    limit,
  });
}

export type TimelineEntry =
  | { kind: "memory"; id: string; date: Date; userName: string; note: string; recipe: { id: string; title: string } }
  | { kind: "origin"; id: string; date: Date; personName: string; personId: string; firstMadeYear: number; recipe: { id: string; title: string } };

/** Memories on recipes the user can see, plus recipe origins with a year, newest first. */
export async function familyTimeline(userId: string, limit = 100): Promise<TimelineEntry[]> {
  const db = getDb();
  // Relational queries alias the root table ("recipeMemory"), so the correlated subquery must
  // reference the aliased column passed to the where callback, not schema.recipeMemory.
  const visible = (memory: typeof recipeMemory._.columns) =>
    exists(
      db
        .select({ one: sql`1` })
        .from(recipe)
        .where(
          and(
            eq(recipe.id, memory.recipeId),
            sql`(${recipe.ownerId} = ${userId}
              OR EXISTS (SELECT 1 FROM ${recipeCollaborator} WHERE ${recipeCollaborator.recipeId} = ${recipe.id} AND ${recipeCollaborator.userId} = ${userId})
              OR EXISTS (SELECT 1 FROM ${cookbookRecipe} JOIN ${cookbookMember} ON ${cookbookMember.cookbookId} = ${cookbookRecipe.cookbookId}
                         WHERE ${cookbookRecipe.recipeId} = ${recipe.id} AND ${cookbookMember.userId} = ${userId}))`
          )
        )
    );
  const [memories, origins] = await Promise.all([
    db.query.recipeMemory.findMany({
      where: (memory) => visible(memory),
      with: { user: { columns: { name: true } }, recipe: { columns: { id: true, title: true } } },
      orderBy: [desc(recipeMemory.madeOn)],
      limit,
    }),
    db
      .select({
        id: recipe.id,
        title: recipe.title,
        firstMadeYear: recipe.firstMadeYear,
        personId: person.id,
        personName: person.name,
      })
      .from(recipe)
      .innerJoin(person, eq(person.id, recipe.originPersonId))
      .where(and(eq(person.ownerUserId, userId), sql`${recipe.firstMadeYear} IS NOT NULL`))
      .orderBy(desc(recipe.firstMadeYear))
      .limit(limit),
  ]);
  const entries: TimelineEntry[] = [
    ...memories.map((entry) => ({
      kind: "memory" as const,
      id: entry.id,
      date: entry.madeOn,
      userName: entry.user.name,
      note: entry.note,
      recipe: entry.recipe,
    })),
    ...origins.map((row) => ({
      kind: "origin" as const,
      id: `origin-${row.id}`,
      date: new Date(Date.UTC(row.firstMadeYear as number, 0, 1)),
      personName: row.personName,
      personId: row.personId,
      firstMadeYear: row.firstMadeYear as number,
      recipe: { id: row.id, title: row.title },
    })),
  ];
  return entries.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
