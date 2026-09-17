import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db/client";
import { publicCookbookPath, publicRecipePath } from "@/lib/paths";

function revalidateShared() {
  revalidatePath("/explore");
  revalidatePath("/explore/[category]", "page");
  revalidatePath("/sitemap.xml");
}

/** Purge the cached public pages that show this recipe (its own page, its cookbooks, explore, sitemap). */
export async function revalidatePublicRecipe(recipeId: string): Promise<void> {
  const db = getDb();
  const found = await db.query.recipe.findFirst({
    where: eq(schema.recipe.id, recipeId),
    columns: { id: true, slug: true },
    with: { cookbookRecipes: { columns: { id: true }, with: { cookbook: { columns: { slug: true, visibility: true } } } } },
  });
  if (!found) {
    revalidateShared();
    return;
  }
  revalidatePath(publicRecipePath(found));
  revalidatePath(`/r/${found.id}`);
  for (const entry of found.cookbookRecipes) {
    if (entry.cookbook.visibility !== "private") {
      revalidatePath(publicCookbookPath(entry.cookbook));
    }
  }
  revalidateShared();
}

export async function revalidatePublicCookbook(cookbookId: string): Promise<void> {
  const db = getDb();
  const found = await db.query.cookbook.findFirst({
    where: eq(schema.cookbook.id, cookbookId),
    columns: { slug: true },
    with: { recipes: { columns: { id: true }, with: { recipe: { columns: { id: true, slug: true } } } } },
  });
  if (found) {
    revalidatePath(publicCookbookPath(found));
    for (const entry of found.recipes) {
      revalidatePath(publicRecipePath(entry.recipe));
    }
  }
  revalidateShared();
}
