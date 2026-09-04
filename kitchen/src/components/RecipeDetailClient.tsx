"use client";

import { useState, type ReactNode } from "react";
import { KitchenView } from "@/components/KitchenView";
import { RecipeDetailMain, type RecipeDetailMainProps } from "@/components/RecipeDetailMain";
import { RecipeDetailToolbar } from "@/components/RecipeDetailToolbar";
import { scaleIngredientLines } from "@/lib/scale-ingredients";
import { splitLines } from "@/lib/tags";

type Collaborator = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

type RecipeDetailClientProps = {
  recipeId: string;
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps: string;
  baseServings: number;
  favorited: boolean;
  canExport: boolean;
  canEdit: boolean;
  canInvite: boolean;
  isOwner: boolean;
  collaborators: Collaborator[];
  exportHref: string;
  main: Omit<
    RecipeDetailMainProps,
    "recipeId" | "title" | "ingredients" | "baseServings" | "servings" | "onServingsChange"
  >;
  children: ReactNode;
};

export function RecipeDetailClient({
  recipeId,
  title,
  ingredients,
  steps,
  bakingSteps,
  baseServings,
  favorited,
  canExport,
  canEdit,
  canInvite,
  isOwner,
  collaborators,
  exportHref,
  main,
  children,
}: RecipeDetailClientProps) {
  const [cookModeOn, setCookModeOn] = useState(false);
  const [servings, setServings] = useState(baseServings);

  const factor = servings / baseServings;
  const scaledIngredients = scaleIngredientLines(splitLines(ingredients), factor).join("\n");

  return (
    <>
      <RecipeDetailToolbar
        recipeId={recipeId}
        favorited={favorited}
        canExport={canExport}
        canEdit={canEdit}
        canInvite={canInvite}
        isOwner={isOwner}
        collaborators={collaborators}
        exportHref={exportHref}
        cookModeOn={cookModeOn}
        onCookModeChange={setCookModeOn}
      />
      {cookModeOn ? (
        <KitchenView title={title} ingredients={scaledIngredients} steps={steps} bakingSteps={bakingSteps} />
      ) : (
        <>
          <RecipeDetailMain
            {...main}
            recipeId={recipeId}
            title={title}
            ingredients={ingredients}
            baseServings={baseServings}
            servings={servings}
            onServingsChange={setServings}
          />
          {children}
        </>
      )}
    </>
  );
}
