/** Pure helpers for the print-ready cookbook (see docs/HERITAGE.md §3b). */

export const OTHER_CHAPTER = "Other recipes";

export type BookRecipe = {
  id: string;
  title: string;
  occasion?: string | null;
};

export type BookChapter<T extends BookRecipe> = {
  title: string;
  recipes: T[];
};

/**
 * Bucket recipes into chapters by occasion. Named occasions come first in
 * alphabetical order; everything without one falls into "Other recipes", which
 * is always last. Recipe order inside a chapter follows the input order, so a
 * cookbook's own ordering is preserved.
 */
export function groupIntoChapters<T extends BookRecipe>(recipes: T[]): BookChapter<T>[] {
  const byOccasion = new Map<string, T[]>();
  const other: T[] = [];

  for (const recipe of recipes) {
    const occasion = recipe.occasion?.trim();
    if (!occasion) {
      other.push(recipe);
      continue;
    }
    const bucket = byOccasion.get(occasion);
    if (bucket) {
      bucket.push(recipe);
    } else {
      byOccasion.set(occasion, [recipe]);
    }
  }

  const chapters = [...byOccasion.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([title, items]) => ({ title, recipes: items }));

  if (other.length > 0) {
    chapters.push({ title: OTHER_CHAPTER, recipes: other });
  }
  return chapters;
}

/** "The Lau Family Cookbook" when a family name is set, otherwise the cookbook title. */
export function bookTitle(cookbook: { title: string; familyName?: string | null }): string {
  const family = cookbook.familyName?.trim();
  if (!family) {
    return cookbook.title.trim() || "Our Cookbook";
  }
  return `The ${family} Family Cookbook`;
}

export type BookPerson = {
  id: string;
  name: string;
  relationship?: string | null;
  birthYear?: number | null;
  passedYear?: number | null;
};

export type BookContributor = BookPerson & { recipeCount: number };

/**
 * Distinct origin people across the book's recipes, most-contributed first and
 * then alphabetical, for the contributors page.
 */
export function bookContributors(
  recipes: Array<{ originPerson?: BookPerson | null }>,
): BookContributor[] {
  const byId = new Map<string, BookContributor>();
  for (const recipe of recipes) {
    const person = recipe.originPerson;
    if (!person?.name?.trim()) {
      continue;
    }
    const existing = byId.get(person.id);
    if (existing) {
      existing.recipeCount += 1;
    } else {
      byId.set(person.id, {
        id: person.id,
        name: person.name.trim(),
        relationship: person.relationship ?? null,
        birthYear: person.birthYear ?? null,
        passedYear: person.passedYear ?? null,
        recipeCount: 1,
      });
    }
  }
  return [...byId.values()].sort(
    (a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name, "en"),
  );
}
