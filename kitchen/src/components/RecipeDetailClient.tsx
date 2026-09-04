"use client";

import { useState, type ReactNode } from "react";
import { KitchenView } from "@/components/KitchenView";
import { RecipeDetailToolbar } from "@/components/RecipeDetailToolbar";

type Collaborator = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

export function RecipeDetailClient({
  recipeId,
  title,
  ingredients,
  steps,
  bakingSteps,
  favorited,
  canExport,
  canEdit,
  canInvite,
  isOwner,
  collaborators,
  exportHref,
  children,
}: {
  recipeId: string;
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps: string;
  favorited: boolean;
  canExport: boolean;
  canEdit: boolean;
  canInvite: boolean;
  isOwner: boolean;
  collaborators: Collaborator[];
  exportHref: string;
  children: ReactNode;
}) {
  const [cookModeOn, setCookModeOn] = useState(false);

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
        <KitchenView title={title} ingredients={ingredients} steps={steps} bakingSteps={bakingSteps} />
      ) : (
        children
      )}
    </>
  );
}
