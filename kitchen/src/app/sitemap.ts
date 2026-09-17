import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { appUrl, publicCookbookPath, publicRecipePath } from "@/lib/paths";
import { listPublicRecipeRefs } from "@/lib/public-recipes";
import { RECIPE_CATEGORIES } from "@/lib/types";

// Rendered on demand (the build has no database); cheap: two indexed queries.
export const dynamic = "force-dynamic";

/** Only public content is listed; the app itself is disallowed in robots.ts. Served at /kitchen/sitemap.xml. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getDb();
  const [recipes, cookbooks] = await Promise.all([
    listPublicRecipeRefs(),
    db.query.cookbook.findMany({
      where: eq(schema.cookbook.visibility, "public"),
      columns: { slug: true, updatedAt: true },
    }),
  ]);
  const now = new Date();
  return [
    { url: appUrl("/explore"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...RECIPE_CATEGORIES.map((category) => ({
      url: appUrl(`/explore/${category}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...cookbooks.map((cookbook) => ({
      url: appUrl(publicCookbookPath(cookbook)),
      lastModified: cookbook.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...recipes.map((recipe) => ({
      url: appUrl(publicRecipePath(recipe)),
      lastModified: recipe.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
