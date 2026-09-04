"use client";

import { useMemo, useState } from "react";
import { COMMON_INGREDIENTS } from "@/lib/common-ingredients";
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES, RECIPE_TYPES, type RecipeCategory, type RecipeDifficulty, type RecipeType } from "@/lib/types";

function parseIngredientLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinIngredientLines(lines: string[]): string {
  return lines.join("\n");
}

export function RecipeEditor({
  saveAction,
  importAction,
  submitLabel,
  defaultServings,
  defaults,
  hiddenFields,
}: {
  saveAction: (formData: FormData) => Promise<void>;
  importAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
  defaultServings?: number;
  defaults?: {
    title?: string;
    ingredients?: string;
    steps?: string;
    bakingSteps?: string;
    tags?: string;
    servings?: number | null;
    recipeType?: RecipeType;
    category?: RecipeCategory | null;
    cookMinutes?: number | null;
    difficulty?: RecipeDifficulty | null;
    attribution?: string;
    photoPath?: string;
    photoAlt?: string;
  };
  hiddenFields?: Record<string, string>;
}) {
  const [tab, setTab] = useState<"type" | "import">("type");
  const [recipeType, setRecipeType] = useState<RecipeType>(defaults?.recipeType ?? "cooking");
  const [ingredientLines, setIngredientLines] = useState<string[]>(
    parseIngredientLines(defaults?.ingredients ?? "")
  );
  const [customIngredient, setCustomIngredient] = useState("");

  const ingredientsValue = useMemo(() => joinIngredientLines(ingredientLines), [ingredientLines]);

  function addIngredient(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setIngredientLines((current) => {
      if (current.some((line) => line.toLowerCase() === trimmed.toLowerCase())) {
        return current;
      }
      return [...current, trimmed];
    });
    setCustomIngredient("");
  }

  function removeIngredient(index: number) {
    setIngredientLines((current) => current.filter((_, i) => i !== index));
  }

  const showCookingSteps = recipeType === "cooking" || recipeType === "cooking_and_baking";
  const showBakingSteps = recipeType === "baking" || recipeType === "cooking_and_baking";

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("type")}
          className={`rounded-xl px-4 py-2 ${tab === "type" ? "bg-clay text-white" : "border border-line"}`}
        >
          Type recipe
        </button>
        {importAction ? (
          <button
            type="button"
            onClick={() => setTab("import")}
            className={`rounded-xl px-4 py-2 ${tab === "import" ? "bg-clay text-white" : "border border-line"}`}
          >
            Import from link
          </button>
        ) : null}
      </div>

      {tab === "import" && importAction ? (
        <form action={importAction} className="grid gap-4">
          <p className="text-muted">
            Paste a food blog, Instagram, or TikTok link. You will review the draft before saving.
          </p>
          <label className="grid gap-1">
            <span className="font-medium">Recipe URL</span>
            <input
              name="url"
              type="url"
              required
              placeholder="https://..."
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>
          <button
            type="submit"
            className="btn w-fit rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark"
          >
            Fetch draft
          </button>
        </form>
      ) : (
        <form action={saveAction} className="grid gap-5" encType="multipart/form-data">
          {hiddenFields
            ? Object.entries(hiddenFields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))
            : null}
          <input type="hidden" name="ingredients" value={ingredientsValue} />
          <input type="hidden" name="recipeType" value={recipeType} />

          <fieldset className="grid gap-2">
            <legend className="font-medium">Recipe type</legend>
            <div className="flex flex-wrap gap-3">
              {RECIPE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recipeTypeChoice"
                    checked={recipeType === type}
                    onChange={() => setRecipeType(type)}
                  />
                  <span>
                    {type === "cooking"
                      ? "Cooking"
                      : type === "baking"
                        ? "Baking"
                        : "Cooking + baking"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-1">
            <span className="font-medium">Name</span>
            <input
              name="title"
              required
              defaultValue={defaults?.title ?? ""}
              className="rounded-xl border border-line bg-white px-3 py-3"
            />
          </label>

          <div className="grid gap-3">
            <span className="font-medium">Ingredients</span>
            <p className="text-sm text-muted">Tap common ingredients or add your own.</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_INGREDIENTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => addIngredient(item)}
                  className="rounded-full border border-line bg-white px-3 py-1 text-sm hover:bg-paper"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customIngredient}
                onChange={(event) => setCustomIngredient(event.target.value)}
                placeholder="Add custom ingredient"
                className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addIngredient(customIngredient);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addIngredient(customIngredient)}
                className="rounded-xl border border-line px-4 py-2"
              >
                Add
              </button>
            </div>
            {ingredientLines.length > 0 ? (
              <ul className="grid gap-2">
                {ingredientLines.map((line, index) => (
                  <li
                    key={`${line}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2"
                  >
                    <span>{line}</span>
                    <button type="button" onClick={() => removeIngredient(index)} className="text-clay">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No ingredients yet.</p>
            )}
          </div>

          {showCookingSteps ? (
            <label className="grid gap-1">
              <span className="font-medium">Cooking instructions (one step per line)</span>
              <textarea
                name="steps"
                rows={8}
                defaultValue={defaults?.steps ?? ""}
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            </label>
          ) : (
            <input type="hidden" name="steps" value="" />
          )}

          {showBakingSteps ? (
            <label className="grid gap-1">
              <span className="font-medium">Baking instructions (one step per line)</span>
              <textarea
                name="bakingSteps"
                rows={8}
                defaultValue={defaults?.bakingSteps ?? ""}
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            </label>
          ) : (
            <input type="hidden" name="bakingSteps" value="" />
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="font-medium">Category</span>
              <select
                name="category"
                defaultValue={defaults?.category ?? ""}
                className="rounded-xl border border-line bg-white px-3 py-3"
              >
                <option value="">None</option>
                {RECIPE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category === "breads" ? "Breads" : "Pastas"}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-medium">Cook time (minutes)</span>
              <input
                name="cookMinutes"
                type="number"
                min={1}
                defaultValue={defaults?.cookMinutes ?? ""}
                placeholder="45"
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-medium">Difficulty</span>
              <select
                name="difficulty"
                defaultValue={defaults?.difficulty ?? ""}
                className="rounded-xl border border-line bg-white px-3 py-3"
              >
                <option value="">None</option>
                {RECIPE_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === "easy"
                      ? "Easy"
                      : difficulty === "intermediate"
                        ? "Intermediate"
                        : "Hard"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-medium">Tags</span>
              <input
                name="tags"
                defaultValue={defaults?.tags ?? ""}
                placeholder="chicken, weeknight"
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-medium">Servings</span>
              <input
                name="servings"
                type="number"
                min={1}
                defaultValue={defaults?.servings ?? defaultServings ?? ""}
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            </label>
          </div>

          {defaults?.attribution !== undefined ? (
            <label className="grid gap-1">
              <span className="font-medium">Source / attribution</span>
              <input
                name="attribution"
                defaultValue={defaults.attribution}
                className="rounded-xl border border-line bg-white px-3 py-3"
              />
            </label>
          ) : null}

          <label className="grid gap-1">
            <span className="font-medium">Photo (optional)</span>
            {defaults?.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={defaults.photoPath}
                alt={defaults.photoAlt ?? "Current recipe photo"}
                className="max-h-48 w-full rounded-xl object-cover"
              />
            ) : null}
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          </label>

          <button
            type="submit"
            className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark"
          >
            {submitLabel}
          </button>
        </form>
      )}
    </div>
  );
}
