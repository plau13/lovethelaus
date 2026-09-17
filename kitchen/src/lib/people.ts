import { and, asc, count, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { parseYear } from "@/lib/heritage";

const { person, recipe } = schema;

export type PersonInput = {
  name: string;
  relationship?: string | null;
  birthYear?: string | number | null;
  passedYear?: string | number | null;
  bio?: string | null;
};

function normalize(input: PersonInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Give this person a name.");
  }
  const birthYear = parseYear(input.birthYear);
  const passedYear = parseYear(input.passedYear);
  if (birthYear && passedYear && passedYear < birthYear) {
    throw new Error("The year they passed cannot be before the year they were born.");
  }
  return {
    name,
    relationship: input.relationship?.trim() || null,
    birthYear,
    passedYear,
    bio: input.bio?.trim() ?? "",
  };
}

export async function listPeople(ownerUserId: string) {
  const db = getDb();
  return db.query.person.findMany({ where: eq(person.ownerUserId, ownerUserId), orderBy: [asc(person.name)] });
}

export async function peopleWithRecipeCounts(ownerUserId: string) {
  const db = getDb();
  const people = await listPeople(ownerUserId);
  if (people.length === 0) {
    return [];
  }
  const counts = await db
    .select({ personId: recipe.originPersonId, total: count() })
    .from(recipe)
    .where(
      inArray(
        recipe.originPersonId,
        people.map((entry) => entry.id)
      )
    )
    .groupBy(recipe.originPersonId);
  const totals = new Map(counts.map((row) => [row.personId, Number(row.total)]));
  return people.map((entry) => ({ ...entry, recipeCount: totals.get(entry.id) ?? 0 }));
}

export async function getPerson(id: string, ownerUserId: string) {
  const db = getDb();
  const found = await db.query.person.findFirst({
    where: and(eq(person.id, id), eq(person.ownerUserId, ownerUserId)),
    with: {
      recipes: {
        columns: { id: true, slug: true, title: true, firstMadeYear: true, occasion: true, category: true, cookMinutes: true, difficulty: true, tags: true },
        orderBy: (row, { asc: ascending }) => [ascending(row.title)],
      },
    },
  });
  return found ?? null;
}

export async function createPerson(ownerUserId: string, input: PersonInput) {
  const db = getDb();
  const [created] = await db
    .insert(person)
    .values({ ownerUserId, ...normalize(input) })
    .returning();
  return created;
}

export async function updatePerson(id: string, ownerUserId: string, input: PersonInput) {
  const db = getDb();
  const [updated] = await db
    .update(person)
    .set(normalize(input))
    .where(and(eq(person.id, id), eq(person.ownerUserId, ownerUserId)))
    .returning();
  if (!updated) {
    throw new Error("Person not found.");
  }
  return updated;
}

/** Owner only. Recipes that pointed at this person keep their story; the origin link is cleared by the FK. */
export async function deletePerson(id: string, ownerUserId: string) {
  const db = getDb();
  const removed = await db
    .delete(person)
    .where(and(eq(person.id, id), eq(person.ownerUserId, ownerUserId)))
    .returning({ id: person.id });
  if (removed.length === 0) {
    throw new Error("Person not found.");
  }
}
