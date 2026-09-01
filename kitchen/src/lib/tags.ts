export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(/[,#]/)) {
    const tag = part.trim().toLowerCase();
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

export function serializeTags(tags: string[]): string {
  return parseTags(tags.join(",")).join(", ");
}

export function recipeMatchesQuery(
  recipe: { title: string; ingredients: string; steps: string; tags: string },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = `${recipe.title} ${recipe.ingredients} ${recipe.steps} ${recipe.tags}`.toLowerCase();
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
