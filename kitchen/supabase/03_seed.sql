-- Kitchen: seed family users, cookbooks, and sample recipes
-- Run after 01_schema.sql (and optionally 02_storage.sql).
-- Idempotent: safe to re-run.

-- Users (magic-link login emails)
INSERT INTO "User" ("id", "email", "name", "defaultServings", "preferredUnits", "createdAt", "updatedAt")
VALUES
  ('seed_user_mom', 'mom@laus.family', 'Mom', 4, 'us', NOW(), NOW()),
  ('seed_user_dad', 'dad@laus.family', 'Dad', 4, 'us', NOW(), NOW()),
  ('seed_user_alex', 'alex@laus.family', 'Alex', 4, 'us', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "updatedAt" = NOW();

-- Cookbooks
INSERT INTO "Cookbook" ("id", "ownerId", "title", "description", "visibility", "slug", "isDefault", "createdAt", "updatedAt")
VALUES
  ('seed_cb_moms_favorites', 'seed_user_mom', 'Mom''s Favorites', 'Everyday winners from Mom''s kitchen.', 'private', 'moms-favorites', true, NOW(), NOW()),
  ('seed_cb_family_dinners', 'seed_user_mom', 'Family Dinners', 'Shared with Dad and Alex.', 'private', 'family-dinners', false, NOW(), NOW()),
  ('seed_cb_holiday_baking', 'seed_user_mom', 'Holiday Baking', 'Public collection of holiday treats.', 'public', 'holiday-baking', false, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "visibility" = EXCLUDED."visibility",
  "updatedAt" = NOW();

UPDATE "Cookbook" SET "isDefault" = false WHERE "ownerId" = 'seed_user_mom' AND "slug" <> 'moms-favorites';
UPDATE "Cookbook" SET "isDefault" = true WHERE "slug" = 'moms-favorites';

-- Cookbook memberships
INSERT INTO "CookbookMember" ("id", "cookbookId", "userId", "role", "createdAt", "updatedAt")
VALUES
  ('seed_cm_mom_fav', 'seed_cb_moms_favorites', 'seed_user_mom', 'owner', NOW(), NOW()),
  ('seed_cm_mom_fd', 'seed_cb_family_dinners', 'seed_user_mom', 'owner', NOW(), NOW()),
  ('seed_cm_dad_fd', 'seed_cb_family_dinners', 'seed_user_dad', 'editor', NOW(), NOW()),
  ('seed_cm_alex_fd', 'seed_cb_family_dinners', 'seed_user_alex', 'viewer', NOW(), NOW()),
  ('seed_cm_mom_hb', 'seed_cb_holiday_baking', 'seed_user_mom', 'owner', NOW(), NOW())
ON CONFLICT ("cookbookId", "userId") DO UPDATE SET "role" = EXCLUDED."role", "updatedAt" = NOW();

-- Recipes (owned by Mom)
INSERT INTO "Recipe" ("id", "ownerId", "title", "ingredients", "steps", "bakingSteps", "recipeType", "servings", "sourceType", "tags", "createdAt", "updatedAt")
VALUES
  ('seed_recipe_01', 'seed_user_mom', 'Sunday pot roast',
   E'3 lb chuck roast\n4 carrots\n6 potatoes\n1 onion\n2 cups beef broth\nsalt\nblack pepper',
   E'Season the roast with salt and pepper.\nSear in a Dutch oven until browned on all sides.\nAdd vegetables and broth, cover, and braise at 325°F for 3 hours.\nRest 15 minutes before slicing.',
   '', 'cooking', 6, 'typed', 'beef, Sunday, comfort', NOW(), NOW()),
  ('seed_recipe_02', 'seed_user_mom', 'Chicken piccata',
   E'4 chicken cutlets\n1/2 cup flour\n3 tbsp butter\n1/4 cup capers\n1 lemon\n1/2 cup chicken broth\nparsley',
   E'Dredge chicken in flour and pan-fry until golden.\nRemove chicken and deglaze with broth and lemon juice.\nStir in capers and butter, return chicken, simmer 5 minutes.\nFinish with parsley and serve.',
   '', 'cooking', 4, 'typed', 'chicken, weeknight, Italian', NOW(), NOW()),
  ('seed_recipe_03', 'seed_user_mom', 'Mom''s banana bread',
   E'3 ripe bananas\n1/3 cup melted butter\n3/4 cup sugar\n1 egg\n1 tsp vanilla extract\n1 tsp baking soda\npinch of salt\n1 1/2 cups all-purpose flour',
   '',
   E'Mash bananas and mix with melted butter.\nStir in sugar, egg, and vanilla.\nFold in baking soda, salt, and flour until just combined.\nBake at 350°F for 55–60 minutes in a greased loaf pan.',
   'baking', 10, 'typed', 'baking, breakfast, classic', NOW(), NOW()),
  ('seed_recipe_04', 'seed_user_mom', 'Garlic roasted broccoli',
   E'1 lb broccoli florets\n3 cloves garlic\n2 tbsp olive oil\nsalt\nlemon',
   E'Toss broccoli with olive oil, garlic, and salt.\nRoast at 425°F for 18 minutes until crisp-tender.\nFinish with lemon juice before serving.',
   '', 'cooking', 4, 'typed', 'vegetable, side, easy', NOW(), NOW()),
  ('seed_recipe_05', 'seed_user_mom', 'Chocolate chip cookies',
   E'2 1/4 cups all-purpose flour\n1 tsp baking soda\n1 cup butter\n3/4 cup sugar\n3/4 cup brown sugar\n2 eggs\n2 cups chocolate chips\n1 tsp vanilla extract',
   '',
   E'Cream butter and sugars, then beat in eggs and vanilla.\nMix in flour, baking soda, and salt.\nFold in chocolate chips.\nBake at 375°F for 9–11 minutes.',
   'baking', 24, 'typed', 'baking, dessert, kids', NOW(), NOW()),
  ('seed_recipe_06', 'seed_user_mom', 'One-pot pasta primavera',
   E'12 oz pasta\n2 cups cherry tomatoes\n1 zucchini\n2 cups spinach\n3 cloves garlic\nolive oil\nparmesan',
   E'Sauté garlic and vegetables in olive oil.\nAdd pasta and enough water to cover, simmer until tender.\nStir in spinach and parmesan before serving.',
   '', 'cooking', 4, 'typed', 'pasta, vegetarian, weeknight', NOW(), NOW()),
  ('seed_recipe_07', 'seed_user_mom', 'Apple crisp',
   E'6 apples\n1/2 cup sugar\n1 tsp cinnamon\n1 cup oats\n1/2 cup brown sugar\n1/2 cup butter',
   E'Peel and slice apples.\nToss with sugar and cinnamon and spread in a baking dish.',
   E'Rub butter into oats and brown sugar for the topping.\nCover apples and bake at 350°F for 40 minutes.',
   'cooking_and_baking', 8, 'typed', 'dessert, fall, family', NOW(), NOW()),
  ('seed_recipe_08', 'seed_user_mom', 'Simple vinaigrette',
   E'3 tbsp olive oil\n1 tbsp red wine vinegar\n1 tsp Dijon mustard\nsalt\nblack pepper',
   E'Whisk all ingredients until emulsified.\nTaste and adjust salt.',
   '', 'cooking', 4, 'typed', 'salad, basics', NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "ingredients" = EXCLUDED."ingredients",
  "steps" = EXCLUDED."steps",
  "bakingSteps" = EXCLUDED."bakingSteps",
  "recipeType" = EXCLUDED."recipeType",
  "servings" = EXCLUDED."servings",
  "tags" = EXCLUDED."tags",
  "updatedAt" = NOW();

-- Link recipes to cookbooks
INSERT INTO "CookbookRecipe" ("id", "cookbookId", "recipeId", "position", "createdAt", "updatedAt")
SELECT 'seed_cr_fav_' || r.n, 'seed_cb_moms_favorites', 'seed_recipe_' || lpad(r.n::text, 2, '0'), r.n - 1, NOW(), NOW()
FROM generate_series(1, 8) AS r(n)
ON CONFLICT ("cookbookId", "recipeId") DO NOTHING;

INSERT INTO "CookbookRecipe" ("id", "cookbookId", "recipeId", "position", "createdAt", "updatedAt")
SELECT 'seed_cr_fd_' || r.n, 'seed_cb_family_dinners', 'seed_recipe_' || lpad(r.n::text, 2, '0'), r.n - 1, NOW(), NOW()
FROM generate_series(1, 5) AS r(n)
ON CONFLICT ("cookbookId", "recipeId") DO NOTHING;

INSERT INTO "CookbookRecipe" ("id", "cookbookId", "recipeId", "position", "createdAt", "updatedAt")
SELECT 'seed_cr_hb_' || r.n, 'seed_cb_holiday_baking', r.id, r.pos, NOW(), NOW()
FROM (VALUES ('seed_recipe_03', 0), ('seed_recipe_05', 1), ('seed_recipe_07', 2)) AS r(id, pos)
ON CONFLICT ("cookbookId", "recipeId") DO NOTHING;
