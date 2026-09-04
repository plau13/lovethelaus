"use client";

import { useEffect, useState } from "react";
import { splitLines } from "@/lib/tags";

type WakeLockSentinel = { release: () => Promise<void> };

function RecipeSectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function KitchenView({
  title,
  ingredients,
  steps,
  bakingSteps = "",
}: {
  title: string;
  ingredients: string;
  steps: string;
  bakingSteps?: string;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    let sentinel: WakeLockSentinel | undefined;
    void nav.wakeLock
      ?.request("screen")
      .then((lock) => {
        sentinel = lock;
      })
      .catch(() => undefined);
    return () => {
      void sentinel?.release();
    };
  }, []);

  const cookingLines = splitLines(steps);
  const bakingLines = splitLines(bakingSteps);
  const ingredientLines = splitLines(ingredients);

  return (
    <div className="grid gap-8">
      <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
      <RecipeSectionCard title="Ingredients">
        <ul className="divide-y divide-line text-xl">
          {ingredientLines.map((line, index) => (
            <li key={`${index}-${line}`} className="py-3 first:pt-0 last:pb-0">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-2 size-6"
                  checked={Boolean(checked[index])}
                  onChange={() => setChecked((current) => ({ ...current, [index]: !current[index] }))}
                />
                <span className={checked[index] ? "text-muted line-through" : undefined}>{line}</span>
              </label>
            </li>
          ))}
        </ul>
      </RecipeSectionCard>
      {cookingLines.length > 0 ? (
        <RecipeSectionCard title="Cooking instructions">
          <ol className="grid list-decimal gap-4 pl-6 text-xl leading-relaxed">
            {cookingLines.map((line, index) => (
              <li key={`cook-${index}-${line}`}>{line}</li>
            ))}
          </ol>
        </RecipeSectionCard>
      ) : null}
      {bakingLines.length > 0 ? (
        <RecipeSectionCard title="Baking instructions">
          <ol className="grid list-decimal gap-4 pl-6 text-xl leading-relaxed">
            {bakingLines.map((line, index) => (
              <li key={`bake-${index}-${line}`}>{line}</li>
            ))}
          </ol>
        </RecipeSectionCard>
      ) : null}
    </div>
  );
}
