/**
 * The preferences a cook actually sets, and the one place they are validated.
 *
 * Onboarding and Settings collect the same four things — onboarding runs once,
 * Settings is where you change your mind — so they must agree on what is valid
 * and what a blank field means. Two forms with two validators is how the two
 * drift apart.
 *
 * Every one of these changes behaviour. That is the bar: the previous
 * onboarding asked nine questions and stored the answers as JSON nothing ever
 * read, and `preferredUnits` and `defaultServings` sat in the schema unread for
 * the same reason. A preference that configures nothing is a survey question.
 */
import { PREFERRED_UNITS, VISIBILITIES, type PreferredUnits, type Visibility } from "@/lib/types";

export type KitchenPrefs = {
  /** Title of the default cookbook — the name on your recipe box. */
  recipeBoxName: string;
  /** Prefilled on every new recipe. */
  defaultServings: number;
  /** US or metric. */
  preferredUnits: PreferredUnits;
  /** Visibility a newly created cookbook starts with. */
  defaultCookbookVisibility: Visibility;
};

export const DEFAULT_RECIPE_BOX_NAME = "My recipes";
export const DEFAULT_SERVINGS = 4;

/** Wide enough for a family dinner, narrow enough to stay a sane number. */
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 99;

/** Long enough for "The Lau Family Cookbook", short enough for a heading. */
const MAX_NAME_LENGTH = 60;

function isPreferredUnits(value: string): value is PreferredUnits {
  return (PREFERRED_UNITS as readonly string[]).includes(value);
}

/** Exported: `cookbooks.ts` parses with it, `saveCookbook` falls back on it. */
export function isVisibility(value: string): value is Visibility {
  return (VISIBILITIES as readonly string[]).includes(value);
}

/**
 * Read the four preferences out of a submitted form.
 *
 * Blank means "leave it at the default", never "store an empty value" — the
 * same rule `demo-account.ts` encodes for the environment. A rejected value
 * throws with a sentence a person can act on, because these messages are
 * rendered straight back onto the form.
 */
export function readKitchenPrefs(form: {
  get(name: string): FormDataEntryValue | null;
}): KitchenPrefs {
  const recipeBoxName = String(form.get("recipeBoxName") ?? "").trim() || DEFAULT_RECIPE_BOX_NAME;
  if (recipeBoxName.length > MAX_NAME_LENGTH) {
    throw new Error(`Keep the recipe box name under ${MAX_NAME_LENGTH} characters.`);
  }

  const servingsRaw = String(form.get("defaultServings") ?? "").trim();
  const defaultServings = servingsRaw ? Number(servingsRaw) : DEFAULT_SERVINGS;
  if (!Number.isInteger(defaultServings) || defaultServings < MIN_SERVINGS || defaultServings > MAX_SERVINGS) {
    throw new Error(`Default servings must be a whole number between ${MIN_SERVINGS} and ${MAX_SERVINGS}.`);
  }

  const units = String(form.get("preferredUnits") ?? "").trim() || "us";
  if (!isPreferredUnits(units)) {
    throw new Error("Pick US or metric units.");
  }

  const visibility = String(form.get("defaultCookbookVisibility") ?? "").trim() || "private";
  if (!isVisibility(visibility)) {
    throw new Error("Pick who new cookbooks are visible to.");
  }

  return { recipeBoxName, defaultServings, preferredUnits: units, defaultCookbookVisibility: visibility };
}

/** Labels for the sharing choice, phrased as what it does rather than what it is called. */
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: "Just me, until I share it",
  unlisted: "Anyone with the link",
  public: "Public — listed on Explore",
};

export const UNITS_LABELS: Record<PreferredUnits, string> = {
  us: "US (cups, °F)",
  metric: "Metric (grams, °C)",
};
