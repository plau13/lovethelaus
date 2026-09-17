/**
 * Seed the demo account and sample recipes.
 *   npm run db:seed:demo   (needs DATABASE_URL, BETTER_AUTH_SECRET, DEMO_USER_PASSWORD; optional DEMO_USER_EMAIL/NAME)
 * Idempotent: re-running resets the demo password and leaves existing content in place.
 */
import { and, eq, ne } from "drizzle-orm";
import { createDb, schema } from "../src/db/client";
import { getAuth } from "../src/lib/better-auth";
import { DEMO_RECIPES } from "./demo-recipes";

const DEFAULT_DEMO_EMAIL = "demo@lovethelaus.com";
const DEFAULT_DEMO_NAME = "Demo Kitchen";

function demoEmail(): string {
  return (process.env.DEMO_USER_EMAIL ?? DEFAULT_DEMO_EMAIL).trim().toLowerCase();
}

function demoName(): string {
  return process.env.DEMO_USER_NAME?.trim() || DEFAULT_DEMO_NAME;
}

function demoPassword(): string {
  const password = process.env.DEMO_USER_PASSWORD?.trim();
  if (!password) {
    throw new Error("Set DEMO_USER_PASSWORD before seeding the demo account.");
  }
  return password;
}

async function ensureDemoUser(email: string, name: string, password: string): Promise<string> {
  const db = createDb();
  const auth = getAuth();
  const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email), columns: { id: true } });

  if (!existing) {
    const result = await auth.api.signUpEmail({ body: { email, password, name } });
    const id = result.user.id;
    await db
      .update(schema.user)
      .set({ emailVerified: true, subscriptionTier: "subscriber", name })
      .where(eq(schema.user.id, id));
    return id;
  }

  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(existing.id, await ctx.password.hash(password));
  await db
    .update(schema.user)
    .set({ emailVerified: true, subscriptionTier: "subscriber", name })
    .where(eq(schema.user.id, existing.id));
  return existing.id;
}

async function upsertCookbook(
  ownerId: string,
  slug: string,
  values: { title: string; description: string; visibility: string; isDefault?: boolean }
) {
  const db = createDb();
  const [row] = await db
    .insert(schema.cookbook)
    .values({ ownerId, slug, ...values, isDefault: values.isDefault ?? false })
    .onConflictDoUpdate({
      target: schema.cookbook.slug,
      set: { ownerId, title: values.title, visibility: values.visibility, isDefault: values.isDefault ?? false },
    })
    .returning();
  await db.insert(schema.cookbookMember).values({ cookbookId: row.id, userId: ownerId, role: "owner" }).onConflictDoNothing();
  return row;
}

async function seedDemoContent(userId: string) {
  const db = createDb();
  const myRecipes = await upsertCookbook(userId, "demo-my-recipes", {
    title: "My recipes",
    description: "Default recipe box.",
    visibility: "private",
    isDefault: true,
  });
  const familyFavorites = await upsertCookbook(userId, "demo-family-favorites", {
    title: "Family Favorites",
    description: "Everyday winners to cook on repeat.",
    visibility: "private",
  });
  const holidayBaking = await upsertCookbook(userId, "demo-holiday-baking", {
    title: "Holiday Baking",
    description: "Public collection of holiday treats.",
    visibility: "public",
  });
  await db
    .update(schema.cookbook)
    .set({ isDefault: false })
    .where(and(eq(schema.cookbook.ownerId, userId), ne(schema.cookbook.id, myRecipes.id)));

  for (const [index, seed] of DEMO_RECIPES.entries()) {
    const existing = await db.query.recipe.findFirst({
      where: and(eq(schema.recipe.ownerId, userId), eq(schema.recipe.title, seed.title)),
      columns: { id: true },
    });
    const recipeId =
      existing?.id ??
      (
        await db
          .insert(schema.recipe)
          .values({
            ownerId: userId,
            title: seed.title,
            ingredients: seed.ingredients.join("\n"),
            steps: seed.steps.join("\n"),
            bakingSteps: (seed.bakingSteps ?? []).join("\n"),
            recipeType: seed.recipeType,
            tags: seed.tags.join(", "),
            servings: seed.servings,
            sourceType: "typed",
          })
          .returning({ id: schema.recipe.id })
      )[0].id;

    const memberships = [myRecipes.id];
    if (index < 5) memberships.push(familyFavorites.id);
    if (seed.recipeType !== "cooking") memberships.push(holidayBaking.id);
    for (const cookbookId of memberships) {
      await db.insert(schema.cookbookRecipe).values({ cookbookId, recipeId, position: index }).onConflictDoNothing();
    }
  }
}

async function main() {
  const email = demoEmail();
  const name = demoName();
  const password = demoPassword();

  const userId = await ensureDemoUser(email, name, password);
  await seedDemoContent(userId);

  const appUrl = process.env.APP_URL ?? "https://lovethelaus.com/kitchen";
  console.log(`Demo seed complete for ${email} (${name})`);
  console.log(`${DEMO_RECIPES.length} recipes across 3 cookbooks (My recipes, Family Favorites, Holiday Baking).`);
  console.log(`Sign in: ${appUrl}/sign-in  (email: ${email})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
