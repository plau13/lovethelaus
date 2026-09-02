export type DemoRecipe = {
  title: string;
  recipeType: "cooking" | "baking" | "cooking_and_baking";
  ingredients: string[];
  steps: string[];
  bakingSteps?: string[];
  tags: string[];
  servings: number;
};

export const DEMO_RECIPES: DemoRecipe[] = [
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
    title: "Banana bread",
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
