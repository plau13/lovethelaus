import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_RECIPES } from "./demo-recipes";

const prisma = new PrismaClient();

const DEFAULT_DEMO_EMAIL = "demo@lovethelaus.com";
const DEFAULT_DEMO_NAME = "Demo Kitchen";
const PRESTON_DEMO_EMAIL = "preston.lau13@gmail.com";

function demoEmail(): string {
  return (process.env.DEMO_USER_EMAIL ?? DEFAULT_DEMO_EMAIL).trim().toLowerCase();
}

function demoName(email: string): string {
  const configured = process.env.DEMO_USER_NAME?.trim();
  if (configured) {
    return configured;
  }
  if (email === PRESTON_DEMO_EMAIL) {
    return "Preston";
  }
  return DEFAULT_DEMO_NAME;
}

function demoPassword(): string {
  const password = process.env.DEMO_USER_PASSWORD?.trim();
  if (!password) {
    throw new Error("Set DEMO_USER_PASSWORD before seeding the demo account.");
  }
  return password;
}

async function ensureSupabaseAuthUser(
  supabaseAdmin: SupabaseClient,
  email: string,
  name: string,
  password: string
) {
  const { data: listed, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    throw listError;
  }
  const existing = listed.users.find((entry) => entry.email?.toLowerCase() === email);
  if (existing) {
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    return existing.id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user) {
    throw error ?? new Error(`Failed to create Supabase user for ${email}`);
  }
  return data.user.id;
}

async function seedDemoContent(demoUser: { id: string }) {
  const myRecipes = await prisma.cookbook.upsert({
    where: { slug: "demo-my-recipes" },
    update: { title: "My recipes", ownerId: demoUser.id, isDefault: true, visibility: "private" },
    create: {
      ownerId: demoUser.id,
      title: "My recipes",
      description: "Default recipe box.",
      visibility: "private",
      slug: "demo-my-recipes",
      isDefault: true,
      members: { create: { userId: demoUser.id, role: "owner" } },
    },
  });

  const familyFavorites = await prisma.cookbook.upsert({
    where: { slug: "demo-family-favorites" },
    update: { title: "Family Favorites", ownerId: demoUser.id, visibility: "private" },
    create: {
      ownerId: demoUser.id,
      title: "Family Favorites",
      description: "Everyday winners to cook on repeat.",
      visibility: "private",
      slug: "demo-family-favorites",
      members: { create: { userId: demoUser.id, role: "owner" } },
    },
  });

  const holidayBaking = await prisma.cookbook.upsert({
    where: { slug: "demo-holiday-baking" },
    update: { title: "Holiday Baking", ownerId: demoUser.id, visibility: "public" },
    create: {
      ownerId: demoUser.id,
      title: "Holiday Baking",
      description: "Public collection of holiday treats.",
      visibility: "public",
      slug: "demo-holiday-baking",
      members: { create: { userId: demoUser.id, role: "owner" } },
    },
  });

  await prisma.cookbook.updateMany({
    where: { ownerId: demoUser.id, id: { not: myRecipes.id } },
    data: { isDefault: false },
  });
  await prisma.cookbook.update({
    where: { id: myRecipes.id },
    data: { isDefault: true },
  });

  for (const [index, seed] of DEMO_RECIPES.entries()) {
    const existing = await prisma.recipe.findFirst({
      where: { ownerId: demoUser.id, title: seed.title },
    });
    const recipe =
      existing ??
      (await prisma.recipe.create({
        data: {
          ownerId: demoUser.id,
          title: seed.title,
          ingredients: seed.ingredients.join("\n"),
          steps: seed.steps.join("\n"),
          bakingSteps: (seed.bakingSteps ?? []).join("\n"),
          recipeType: seed.recipeType,
          tags: seed.tags.join(", "),
          servings: seed.servings,
          sourceType: "typed",
        },
      }));

    const inMyRecipes = await prisma.cookbookRecipe.findUnique({
      where: { cookbookId_recipeId: { cookbookId: myRecipes.id, recipeId: recipe.id } },
    });
    if (!inMyRecipes) {
      await prisma.cookbookRecipe.create({
        data: { cookbookId: myRecipes.id, recipeId: recipe.id, position: index },
      });
    }

    if (index < 5) {
      const inFavorites = await prisma.cookbookRecipe.findUnique({
        where: { cookbookId_recipeId: { cookbookId: familyFavorites.id, recipeId: recipe.id } },
      });
      if (!inFavorites) {
        await prisma.cookbookRecipe.create({
          data: { cookbookId: familyFavorites.id, recipeId: recipe.id, position: index },
        });
      }
    }

    if (seed.recipeType !== "cooking") {
      const inHoliday = await prisma.cookbookRecipe.findUnique({
        where: { cookbookId_recipeId: { cookbookId: holidayBaking.id, recipeId: recipe.id } },
      });
      if (!inHoliday) {
        await prisma.cookbookRecipe.create({
          data: { cookbookId: holidayBaking.id, recipeId: recipe.id, position: index },
        });
      }
    }
  }
}

async function main() {
  const email = demoEmail();
  const name = demoName(email);
  const password = demoPassword();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let demoUser = await prisma.user.findUnique({ where: { email } });
  let authUserId = demoUser?.authUserId ?? null;

  if (serviceRoleKey && supabaseUrl) {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    authUserId = await ensureSupabaseAuthUser(supabaseAdmin, email, name, password);
  } else if (!demoUser?.authUserId) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY to create the auth user, or sign up at /kitchen/sign-up first."
    );
  } else {
    console.log("No SUPABASE_SERVICE_ROLE_KEY — seeding Prisma content for existing auth user.");
  }

  demoUser = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      ...(authUserId ? { authUserId } : {}),
      subscriptionTier: "subscriber",
    },
    create: {
      email,
      name,
      authUserId,
      defaultServings: 4,
      preferredUnits: "us",
      subscriptionTier: "subscriber",
    },
  });

  await seedDemoContent(demoUser);

  const appUrl = process.env.APP_URL ?? "https://lovethelaus.com/kitchen";
  console.log(`Demo seed complete for ${email} (${name})`);
  console.log(`${DEMO_RECIPES.length} recipes across 3 cookbooks (My recipes, Family Favorites, Holiday Baking).`);
  console.log(`Sign in: ${appUrl}/sign-in`);
  console.log(`Email: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
