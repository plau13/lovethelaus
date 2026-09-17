export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "cookbook";
}

/** Stable, unique-enough public slug for a recipe: `<title-slug>-<last 4 of id>`. */
export function recipeSlugFor(title: string, id: string): string {
  const base = slugify(title);
  const suffix = id.replace(/[^a-z0-9]/gi, "").slice(-4).toLowerCase() || "r";
  return `${base === "cookbook" ? "recipe" : base}-${suffix}`;
}
