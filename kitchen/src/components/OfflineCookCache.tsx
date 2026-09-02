"use client";

import { useEffect } from "react";

type CookPayload = {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps: string;
};

export function OfflineCookCache({
  enabled,
  recipe,
}: {
  enabled: boolean;
  recipe: CookPayload;
}) {
  useEffect(() => {
    if (!enabled || !("caches" in window)) {
      return;
    }
    const cacheKey = `/kitchen/offline/recipes/${recipe.id}.json`;
    void caches.open("kitchen-offline-v1").then((cache) =>
      cache.put(
        cacheKey,
        new Response(JSON.stringify(recipe), {
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  }, [enabled, recipe]);

  return null;
}
