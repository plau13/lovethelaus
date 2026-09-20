/**
 * Seed the demo account and sample recipes.
 *   npm run db:seed:demo   (needs DATABASE_URL, BETTER_AUTH_SECRET, DEMO_USER_PASSWORD; optional DEMO_USER_EMAIL/NAME)
 * Idempotent: re-running resets the demo password and leaves existing content in place.
 */
import { and, eq, isNull, ne } from "drizzle-orm";
import { createDb, schema } from "../src/db/client";
import { getAuth } from "../src/lib/better-auth";
import { recipeSlugFor } from "../src/lib/slug";
import { demoEmail, demoName, demoPassword, looksLikeEmail } from "../src/lib/demo-account";
import { DEMO_RECIPES } from "./demo-recipes";

/** The address to seed. Blank is absent, so an unset CI secret gets the default. */
function seedEmail(): string {
  const email = demoEmail(process.env);
  if (!looksLikeEmail(email)) {
    throw new Error(`DEMO_USER_EMAIL is not an email address: ${JSON.stringify(email)}`);
  }
  return email;
}

function seedPassword(): string {
  const password = demoPassword(process.env);
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
    await db
      .update(schema.recipe)
      .set({ slug: recipeSlugFor(seed.title, recipeId) })
      .where(and(eq(schema.recipe.id, recipeId), isNull(schema.recipe.slug)));

    const memberships = [myRecipes.id];
    if (index < 5) memberships.push(familyFavorites.id);
    if (seed.recipeType !== "cooking") memberships.push(holidayBaking.id);
    for (const cookbookId of memberships) {
      await db.insert(schema.cookbookRecipe).values({ cookbookId, recipeId, position: index }).onConflictDoNothing();
    }
  }
}

/** People, provenance, and a few "made this" memories so /family and the public pages show the heritage features. */
async function seedHeritage(userId: string) {
  const db = createDb();
  async function upsertPerson(name: string, values: { relationship: string; birthYear?: number; passedYear?: number; bio: string }) {
    const existing = await db.query.person.findFirst({
      where: and(eq(schema.person.ownerUserId, userId), eq(schema.person.name, name)),
      columns: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const [created] = await db.insert(schema.person).values({ ownerUserId: userId, name, ...values }).returning({ id: schema.person.id });
    return created.id;
  }
  const rose = await upsertPerson("Grandma Rose", {
    relationship: "grandmother",
    birthYear: 1931,
    passedYear: 2019,
    bio: "Never measured anything. Cooked for twelve every Sunday and sent everyone home with leftovers.",
  });
  const dad = await upsertPerson("Dad", { relationship: "father", birthYear: 1958, bio: "Grill in any weather. Owns exactly one spice: pepper." });

  const byTitle = async (title: string) =>
    db.query.recipe.findFirst({ where: and(eq(schema.recipe.ownerId, userId), eq(schema.recipe.title, title)), columns: { id: true } });
  const roast = await byTitle(DEMO_RECIPES[0].title);
  const second = await byTitle(DEMO_RECIPES[1]?.title ?? "");
  const third = await byTitle(DEMO_RECIPES[2]?.title ?? "");

  if (roast) {
    await db
      .update(schema.recipe)
      .set({
        originPersonId: rose,
        firstMadeYear: 1974,
        occasion: "Sunday dinner",
        story: "Rose made this every Sunday after church. The secret was searing hard and then leaving it alone for three hours.",
      })
      .where(eq(schema.recipe.id, roast.id));
  }
  if (second) {
    await db
      .update(schema.recipe)
      .set({ originPersonId: dad, firstMadeYear: 1996, occasion: "Summer cookout" })
      .where(eq(schema.recipe.id, second.id));
  }
  if (third && roast) {
    await db
      .update(schema.recipe)
      .set({ adaptedFromRecipeId: roast.id, story: "Rose's method, my spices." })
      .where(eq(schema.recipe.id, third.id));
  }

  const existingMemories = await db.query.recipeMemory.findFirst({ where: eq(schema.recipeMemory.userId, userId), columns: { id: true } });
  if (!existingMemories && roast) {
    await db.insert(schema.recipeMemory).values([
      { recipeId: roast.id, userId, madeOn: new Date("2026-08-31T18:00:00Z"), note: "Used the big pot. Everyone went back for seconds." },
      ...(second ? [{ recipeId: second.id, userId, madeOn: new Date("2026-07-04T18:00:00Z"), note: "Rained. Grilled anyway." }] : []),
    ]);
  }
}

async function main() {
  const email = seedEmail();
  const name = demoName(process.env);
  const password = seedPassword();

  const userId = await ensureDemoUser(email, name, password);
  await seedDemoContent(userId);
  await seedHeritage(userId);

  const appUrl = process.env.APP_URL?.trim() || "https://lovethelaus.com/kitchen";
  console.log(`Demo seed complete for ${email} (${name})`);
  console.log(`${DEMO_RECIPES.length} recipes across 3 cookbooks (My recipes, Family Favorites, Holiday Baking).`);
  console.log(`Sign in: ${appUrl}/sign-in  (email: ${email})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
