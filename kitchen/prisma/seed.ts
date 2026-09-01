import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedRecipe = {
  title: string;
  recipeType: "cooking" | "baking" | "cooking_and_baking";
  ingredients: string[];
  steps: string[];
  bakingSteps?: string[];
  tags: string[];
  servings: number;
};

const RECIPES: SeedRecipe[] = [
  {
    title: "Sunday pot roast",
    recipeType: "cooking",
    ingredients: ["3 lb chuck roast", "4 carrots", "6 potatoes", "1 onion", "2 cups beef broth", "salt", "black pepper"],
    steps: [
      "Season the roast with salt and pepper.",
      "Sear in a Dutch oven until browned on all sides.",
      "Add vegetables and broth, cover, and braise at 325°F for 3 hours.",
      "Rest 15 minutes before slicing.",
    ],
    tags: ["beef", "Sunday", "comfort"],
    servings: 6,
  },
  {
    title: "Chicken piccata",
    recipeType: "cooking",
    ingredients: [
      "4 chicken cutlets",
      "1/2 cup flour",
      "3 tbsp butter",
      "1/4 cup capers",
      "1 lemon",
      "1/2 cup chicken broth",
      "parsley",
    ],
    steps: [
      "Dredge chicken in flour and pan-fry until golden.",
      "Remove chicken and deglaze with broth and lemon juice.",
      "Stir in capers and butter, return chicken, simmer 5 minutes.",
      "Finish with parsley and serve.",
    ],
    tags: ["chicken", "weeknight", "Italian"],
    servings: 4,
  },
  {
    title: "Mom's banana bread",
    recipeType: "baking",
    ingredients: [
      "3 ripe bananas",
      "1/3 cup melted butter",
      "3/4 cup sugar",
      "1 egg",
      "1 tsp vanilla extract",
      "1 tsp baking soda",
      "pinch of salt",
      "1 1/2 cups all-purpose flour",
    ],
    steps: [],
    bakingSteps: [
      "Mash bananas and mix with melted butter.",
      "Stir in sugar, egg, and vanilla.",
      "Fold in baking soda, salt, and flour until just combined.",
      "Bake at 350°F for 55–60 minutes in a greased loaf pan.",
    ],
    tags: ["baking", "breakfast", "classic"],
    servings: 10,
  },
  {
    title: "Garlic roasted broccoli",
    recipeType: "cooking",
    ingredients: ["1 lb broccoli florets", "3 cloves garlic", "2 tbsp olive oil", "salt", "lemon"],
    steps: [
      "Toss broccoli with olive oil, garlic, and salt.",
      "Roast at 425°F for 18 minutes until crisp-tender.",
      "Finish with lemon juice before serving.",
    ],
    tags: ["vegetable", "side", "easy"],
    servings: 4,
  },
  {
    title: "Chocolate chip cookies",
    recipeType: "baking",
    ingredients: [
      "2 1/4 cups all-purpose flour",
      "1 tsp baking soda",
      "1 cup butter",
      "3/4 cup sugar",
      "3/4 cup brown sugar",
      "2 eggs",
      "2 cups chocolate chips",
      "1 tsp vanilla extract",
    ],
    steps: [],
    bakingSteps: [
      "Cream butter and sugars, then beat in eggs and vanilla.",
      "Mix in flour, baking soda, and salt.",
      "Fold in chocolate chips.",
      "Bake at 375°F for 9–11 minutes.",
    ],
    tags: ["baking", "dessert", "kids"],
    servings: 24,
  },
  {
    title: "One-pot pasta primavera",
    recipeType: "cooking",
    ingredients: ["12 oz pasta", "2 cups cherry tomatoes", "1 zucchini", "2 cups spinach", "3 cloves garlic", "olive oil", "parmesan"],
    steps: [
      "Sauté garlic and vegetables in olive oil.",
      "Add pasta and enough water to cover, simmer until tender.",
      "Stir in spinach and parmesan before serving.",
    ],
    tags: ["pasta", "vegetarian", "weeknight"],
    servings: 4,
  },
  {
    title: "Apple crisp",
    recipeType: "cooking_and_baking",
    ingredients: ["6 apples", "1/2 cup sugar", "1 tsp cinnamon", "1 cup oats", "1/2 cup brown sugar", "1/2 cup butter"],
    steps: ["Peel and slice apples.", "Toss with sugar and cinnamon and spread in a baking dish."],
    bakingSteps: [
      "Rub butter into oats and brown sugar for the topping.",
      "Cover apples and bake at 350°F for 40 minutes.",
    ],
    tags: ["dessert", "fall", "family"],
    servings: 8,
  },
  {
    title: "Simple vinaigrette",
    recipeType: "cooking",
    ingredients: ["3 tbsp olive oil", "1 tbsp red wine vinegar", "1 tsp Dijon mustard", "salt", "black pepper"],
    steps: ["Whisk all ingredients until emulsified.", "Taste and adjust salt."],
    tags: ["salad", "basics"],
    servings: 4,
  },
];

async function main() {
  const mom = await prisma.user.upsert({
    where: { email: "mom@laus.family" },
    update: { name: "Mom" },
    create: { email: "mom@laus.family", name: "Mom", defaultServings: 4, preferredUnits: "us" },
  });
  const dad = await prisma.user.upsert({
    where: { email: "dad@laus.family" },
    update: { name: "Dad" },
    create: { email: "dad@laus.family", name: "Dad" },
  });
  const alex = await prisma.user.upsert({
    where: { email: "alex@laus.family" },
    update: { name: "Alex" },
    create: { email: "alex@laus.family", name: "Alex" },
  });

  const momsFavorites = await prisma.cookbook.upsert({
    where: { slug: "moms-favorites" },
    update: { title: "Mom's Favorites", ownerId: mom.id, visibility: "private" },
    create: {
      ownerId: mom.id,
      title: "Mom's Favorites",
      description: "Everyday winners from Mom's kitchen.",
      visibility: "private",
      slug: "moms-favorites",
      isDefault: true,
      members: { create: { userId: mom.id, role: "owner" } },
    },
  });

  const familyDinners = await prisma.cookbook.upsert({
    where: { slug: "family-dinners" },
    update: { title: "Family Dinners", ownerId: mom.id, visibility: "private" },
    create: {
      ownerId: mom.id,
      title: "Family Dinners",
      description: "Shared with Dad and Alex.",
      visibility: "private",
      slug: "family-dinners",
      members: {
        create: [
          { userId: mom.id, role: "owner" },
          { userId: dad.id, role: "editor" },
          { userId: alex.id, role: "viewer" },
        ],
      },
    },
  });

  const holidayBaking = await prisma.cookbook.upsert({
    where: { slug: "holiday-baking" },
    update: { title: "Holiday Baking", ownerId: mom.id, visibility: "public" },
    create: {
      ownerId: mom.id,
      title: "Holiday Baking",
      description: "Public collection of holiday treats.",
      visibility: "public",
      slug: "holiday-baking",
      members: { create: { userId: mom.id, role: "owner" } },
    },
  });

  await prisma.cookbook.updateMany({
    where: { ownerId: mom.id, id: { not: momsFavorites.id } },
    data: { isDefault: false },
  });
  await prisma.cookbook.update({
    where: { id: momsFavorites.id },
    data: { isDefault: true },
  });

  for (const [index, seed] of RECIPES.entries()) {
    const existing = await prisma.recipe.findFirst({
      where: { ownerId: mom.id, title: seed.title },
    });
    const recipe =
      existing ??
      (await prisma.recipe.create({
        data: {
          ownerId: mom.id,
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

    const inFavorites = await prisma.cookbookRecipe.findUnique({
      where: { cookbookId_recipeId: { cookbookId: momsFavorites.id, recipeId: recipe.id } },
    });
    if (!inFavorites) {
      await prisma.cookbookRecipe.create({
        data: { cookbookId: momsFavorites.id, recipeId: recipe.id, position: index },
      });
    }

    if (index < 5) {
      const inFamily = await prisma.cookbookRecipe.findUnique({
        where: { cookbookId_recipeId: { cookbookId: familyDinners.id, recipeId: recipe.id } },
      });
      if (!inFamily) {
        await prisma.cookbookRecipe.create({
          data: { cookbookId: familyDinners.id, recipeId: recipe.id, position: index },
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

  console.log("Seed complete: Mom, Dad, Alex + cookbooks + recipes");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
