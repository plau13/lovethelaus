import type { ReactNode } from "react";

/** Card shell shared by the app's recipe page and the public recipe page. */
export function RecipeSectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function IngredientsCard({ lines }: { lines: string[] }) {
  return (
    <RecipeSectionCard title="Ingredients">
      <ul className="divide-y divide-line text-lg">
        {lines.map((line, index) => (
          <li key={`${index}-${line}`} className="py-2 first:pt-0 last:pb-0">
            {line}
          </li>
        ))}
      </ul>
    </RecipeSectionCard>
  );
}

export function StepsCard({ title, steps, prefix }: { title: string; steps: string[]; prefix: string }) {
  if (steps.length === 0) {
    return null;
  }
  return (
    <RecipeSectionCard title={title}>
      <ol className="grid list-decimal gap-3 pl-5 text-lg leading-relaxed">
        {steps.map((line, index) => (
          <li key={`${prefix}-${index}-${line}`}>{line}</li>
        ))}
      </ol>
    </RecipeSectionCard>
  );
}
