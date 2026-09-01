"use client";

import { useEffect, useState } from "react";
import { splitLines } from "@/lib/tags";

type WakeLockSentinel = { release: () => Promise<void> };

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

  return (
    <div className="grid gap-8">
      <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Ingredients</h2>
        <ul className="grid gap-3 text-xl">
          {splitLines(ingredients).map((line, index) => (
            <li key={`${index}-${line}`}>
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
      </section>
      {cookingLines.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Cooking instructions</h2>
          <ol className="grid list-decimal gap-4 pl-6 text-xl leading-relaxed">
            {cookingLines.map((line, index) => (
              <li key={`cook-${index}-${line}`}>{line}</li>
            ))}
          </ol>
        </section>
      ) : null}
      {bakingLines.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Baking instructions</h2>
          <ol className="grid list-decimal gap-4 pl-6 text-xl leading-relaxed">
            {bakingLines.map((line, index) => (
              <li key={`bake-${index}-${line}`}>{line}</li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
