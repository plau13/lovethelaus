"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ServingsControl } from "@/components/ServingsControl";
import { scaleIngredientLines } from "@/lib/scale-ingredients";
import { splitLines } from "@/lib/tags";

function RecipeSectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

export type RecipeDetailMainProps = {
  recipeId: string;
  title: string;
  ownerName: string;
  coAuthorNames: string[];
  photo: { path: string; alt: string } | null;
  canEdit: boolean;
  metaLine: ReactNode;
  sourceAttribution?: string | null;
  ingredients: string;
  cookingSteps: string[];
  bakingSteps: string[];
  baseServings: number;
  servings: number;
  onServingsChange: (value: number) => void;
  cookTimeLabel?: string | null;
};

export function RecipeDetailMain({
  recipeId,
  title,
  ownerName,
  coAuthorNames,
  photo,
  canEdit,
  metaLine,
  sourceAttribution,
  ingredients,
  cookingSteps,
  bakingSteps,
  baseServings,
  servings,
  onServingsChange,
  cookTimeLabel,
}: RecipeDetailMainProps) {
  const factor = servings / baseServings;
  const ingredientLines = useMemo(() => {
    const lines = splitLines(ingredients);
    return scaleIngredientLines(lines, factor);
  }, [ingredients, factor]);

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-4xl leading-tight">{title}</h1>
      <p className="text-muted">
        By {ownerName}
        {coAuthorNames.length > 0 ? (
          <>
            {" · Co-authors: "}
            {coAuthorNames.join(", ")}
          </>
        ) : null}
      </p>

      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.path} alt={photo.alt} className="max-h-96 w-full rounded-2xl object-cover" />
      ) : canEdit ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper px-4 py-8 text-center text-muted">
          <p>No photo yet.</p>
          <Link href={`/recipes/${recipeId}/edit`} className="text-clay">
            Add a photo
          </Link>
        </div>
      ) : null}

      <p className="text-muted">{metaLine}</p>
      {sourceAttribution ? <p className="text-sm text-muted">{sourceAttribution}</p> : null}

      <div className="flex flex-wrap items-end gap-6">
        <ServingsControl value={servings} onChange={onServingsChange} />
        {cookTimeLabel ? (
          <div className="grid gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">Cook time</span>
            <p className="text-lg font-medium">{cookTimeLabel}</p>
          </div>
        ) : null}
      </div>

      <RecipeSectionCard title="Ingredients">
        <ul className="divide-y divide-line text-lg">
          {ingredientLines.map((line, index) => (
            <li key={`${index}-${line}`} className="py-2 first:pt-0 last:pb-0">
              {line}
            </li>
          ))}
        </ul>
      </RecipeSectionCard>

      {cookingSteps.length > 0 ? (
        <RecipeSectionCard title="Cooking instructions">
          <ol className="grid list-decimal gap-3 pl-5 text-lg leading-relaxed">
            {cookingSteps.map((line, index) => (
              <li key={`cook-${index}-${line}`}>{line}</li>
            ))}
          </ol>
        </RecipeSectionCard>
      ) : null}

      {bakingSteps.length > 0 ? (
        <RecipeSectionCard title="Baking instructions">
          <ol className="grid list-decimal gap-3 pl-5 text-lg leading-relaxed">
            {bakingSteps.map((line, index) => (
              <li key={`bake-${index}-${line}`}>{line}</li>
            ))}
          </ol>
        </RecipeSectionCard>
      ) : null}
    </div>
  );
}
