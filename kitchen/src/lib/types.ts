export const SOURCE_TYPES = [
  "typed",
  "blog",
  "instagram",
  "tiktok",
  "card",
  "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const COOKBOOK_ROLES = ["owner", "editor", "viewer"] as const;

export type CookbookRole = (typeof COOKBOOK_ROLES)[number];

export const VISIBILITIES = ["private", "unlisted", "public"] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export const RECIPE_TYPES = ["cooking", "baking", "cooking_and_baking"] as const;

export type RecipeType = (typeof RECIPE_TYPES)[number];

export const PREFERRED_UNITS = ["us", "metric"] as const;

export type PreferredUnits = (typeof PREFERRED_UNITS)[number];

export const COOKBOOK_LIST_FILTERS = ["all", "private", "shared", "public"] as const;

export type CookbookListFilter = (typeof COOKBOOK_LIST_FILTERS)[number];

export type RecipeExport = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  servings: number | null;
  tags: string[];
  sourceType: string;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  notes: string[];
  updatedAt: string;
};

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  recipes: RecipeExport[];
};

export type ImportDraftShape = {
  title: string;
  ingredients: string;
  steps: string;
  attribution: string;
  sourceType: SourceType;
  sourceUrl: string;
};

export const INTERVIEW_QUESTIONS = [
  {
    id: "oldSite",
    prompt: "What was the old recipe website called?",
  },
  {
    id: "whereNow",
    prompt: "Where do recipes live now (screenshots, Notes, texts, a binder, email)?",
  },
  {
    id: "tenRecipes",
    prompt: "Name 10 recipes you want in first.",
  },
  {
    id: "missed",
    prompt: "What did the old site do that you still miss?",
  },
  {
    id: "findDinner",
    prompt: "How do you find a recipe when dinner is in 20 minutes?",
  },
  {
    id: "wifi",
    prompt: "Is kitchen Wi-Fi reliable, or do recipes need to work offline?",
  },
  {
    id: "printVsScreen",
    prompt: "Print, iPad on the counter, or both?",
  },
  {
    id: "whoEdits",
    prompt: "Who else should add recipes? Can they change yours, or only leave a note?",
  },
  {
    id: "homeScreen",
    prompt: "Website on the Home Screen, or does it need an App Store icon?",
  },
  {
    id: "kidsPhotos",
    prompt: "Any photos of kids that must stay private if a cookbook is shared?",
  },
] as const;
