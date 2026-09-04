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

export const RECIPE_CATEGORIES = ["breads", "pastas"] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const COOK_TIME_BUCKETS = [
  { id: "under-30", label: "Under 30 min", min: 0, max: 29 },
  { id: "30-45", label: "30–45 min", min: 30, max: 45 },
  { id: "45-60", label: "45–60 min", min: 45, max: 60 },
  { id: "60-90", label: "1 hr – 1 hr 30 min", min: 60, max: 90 },
  { id: "90-120", label: "1 hr 30 min – 2 hrs", min: 90, max: 120 },
  { id: "120-plus", label: "2 hrs +", min: 120, max: null },
] as const;

export type CookTimeBucketId = (typeof COOK_TIME_BUCKETS)[number]["id"];

export const RECIPE_DIFFICULTIES = ["easy", "intermediate", "hard"] as const;

export type RecipeDifficulty = (typeof RECIPE_DIFFICULTIES)[number];

export function difficultyLabel(difficulty: string | null | undefined): string {
  switch (difficulty) {
    case "easy":
      return "Easy";
    case "intermediate":
      return "Intermediate";
    case "hard":
      return "Hard";
    default:
      return "";
  }
}

export function categoryLabel(category: string | null | undefined): string {
  switch (category) {
    case "breads":
      return "Breads";
    case "pastas":
      return "Pastas";
    default:
      return "";
  }
}

export function cookTimeBucketFilter(bucketId: string): { cookMinutes: { gte: number; lte?: number } } | null {
  const bucket = COOK_TIME_BUCKETS.find((entry) => entry.id === bucketId);
  if (!bucket) {
    return null;
  }
  if (bucket.max === null) {
    return { cookMinutes: { gte: bucket.min } };
  }
  return { cookMinutes: { gte: bucket.min, lte: bucket.max } };
}

export function formatCookMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) {
    return "";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return hours === 1 ? "1 hr" : `${hours} hrs`;
  }
  return `${hours} hr ${remainder} min`;
}

export const RECIPE_COLLAB_ROLES = ["view", "comment", "edit", "co-author"] as const;

export function collabRoleLabel(role: string): string {
  switch (role) {
    case "view":
      return "View only";
    case "comment":
      return "Comment";
    case "edit":
      return "Edit";
    case "co-author":
      return "Co-author";
    default:
      return role;
  }
}

export type RecipeCollabRole = (typeof RECIPE_COLLAB_ROLES)[number];

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

export type OnboardingQuestion =
  | { id: string; prompt: string; type: "text" }
  | { id: string; prompt: string; type: "textarea" }
  | { id: string; prompt: string; type: "select"; options: readonly { value: string; label: string }[] }
  | { id: string; prompt: string; type: "checkboxes"; options: readonly { value: string; label: string }[] };

export const ONBOARDING_QUESTIONS: readonly OnboardingQuestion[] = [
  {
    id: "familyName",
    prompt: "What should we call your family's recipe box?",
    type: "text",
  },
  {
    id: "whoCooks",
    prompt: "Who else in your family cooks or shares recipes?",
    type: "text",
  },
  {
    id: "recipeSources",
    prompt: "Where do your recipes live today? (binder, Notes, texts, old website, etc.)",
    type: "textarea",
  },
  {
    id: "findRecipes",
    prompt: "When you're planning dinner, how do you usually find a recipe?",
    type: "textarea",
  },
  {
    id: "cookDevice",
    prompt: "How do you prefer to cook from recipes?",
    type: "select",
    options: [
      { value: "phone", label: "Phone" },
      { value: "tablet", label: "Tablet" },
      { value: "printed", label: "Printed" },
      { value: "mix", label: "Mix" },
    ],
  },
  {
    id: "recipeTypes",
    prompt: "What kinds of recipes are you most excited to save?",
    type: "checkboxes",
    options: [
      { value: "classics", label: "Family classics" },
      { value: "weeknight", label: "Weeknight meals" },
      { value: "baking", label: "Baking" },
      { value: "holidays", label: "Holidays" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "sharingComfort",
    prompt: "How do you want to share with family?",
    type: "select",
    options: [
      { value: "solo", label: "Just me for now" },
      { value: "invite", label: "Invite specific people" },
      { value: "open", label: "Happy to share cookbooks" },
    ],
  },
  {
    id: "kitchenWifi",
    prompt: "Is your kitchen Wi-Fi reliable, or do you need recipes to work with spotty connection?",
    type: "select",
    options: [
      { value: "reliable", label: "Reliable" },
      { value: "spotty", label: "Sometimes spotty" },
      { value: "offline", label: "Often offline" },
    ],
  },
  {
    id: "householdNotes",
    prompt: "Any dietary needs, allergies, or household notes we should know? (optional)",
    type: "textarea",
  },
];

export function parseOnboardingAnswers(raw: string): Record<string, string | string[]> {
  try {
    const parsed = JSON.parse(raw) as Record<string, string | string[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function formatOnboardingAnswer(value: string | string[] | undefined): string {
  if (value === undefined) {
    return "—";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }
  return value.trim() || "—";
}
