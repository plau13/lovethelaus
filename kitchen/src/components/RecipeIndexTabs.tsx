import Link from "next/link";
import type { ReactNode } from "react";
import {
  categoryLabel,
  COOK_TIME_BUCKETS,
  RECIPE_CATEGORIES,
  type RecipeCategory,
} from "@/lib/types";

type RecipeFilterParams = {
  activeCategory?: RecipeCategory;
  activeTimeBucket?: string;
  q?: string;
  cookbookId?: string;
};

const TAB_COLORS = [
  "bg-[#f5e6c8] border-[#d4b896]",
  "bg-[#e8d4bc] border-[#c4a484]",
  "bg-[#f0dcc4] border-[#c9ad8c]",
] as const;

function recipesHref(args: RecipeFilterParams & { category?: RecipeCategory | ""; timeBucket?: string }) {
  const params = new URLSearchParams();
  if (args.q) {
    params.set("q", args.q);
  }
  if (args.cookbookId) {
    params.set("cookbook", args.cookbookId);
  }
  if (args.category) {
    params.set("category", args.category);
  }
  if (args.timeBucket) {
    params.set("time", args.timeBucket);
  }
  const query = params.toString();
  return query ? `/recipes?${query}` : "/recipes";
}

export function RecipeCategoryTabs({ activeCategory, activeTimeBucket, q, cookbookId }: RecipeFilterParams) {
  const categoryTabs: Array<{ id: RecipeCategory | ""; label: string }> = [
    { id: "", label: "All" },
    ...RECIPE_CATEGORIES.map((category) => ({ id: category, label: categoryLabel(category) })),
  ];

  return (
    <div className="flex items-end gap-1 pl-1">
      {categoryTabs.map((tab, index) => {
        const isActive = (tab.id || undefined) === activeCategory;
        const colors = TAB_COLORS[index % TAB_COLORS.length];
        return (
          <Link
            key={tab.id || "all"}
            href={recipesHref({ q, cookbookId, category: tab.id, timeBucket: activeTimeBucket })}
            className={`relative -mb-px min-w-[5.5rem] rounded-t-xl border px-4 py-2.5 text-center font-serif text-lg no-underline shadow-sm ${colors} ${
              isActive
                ? "z-20 border-b-transparent text-ink ring-2 ring-clay/20"
                : "z-10 text-ink/80 hover:-translate-y-0.5"
            }`}
            style={{
              transform: isActive
                ? "rotate(-1deg) translateY(-4px)"
                : `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg) translateY(0)`,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function RecipeTimeFilters({ activeCategory, activeTimeBucket, q, cookbookId }: RecipeFilterParams) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={recipesHref({ q, cookbookId, category: activeCategory, timeBucket: "" })}
        className={`rounded-full px-3 py-1.5 text-sm no-underline ${
          !activeTimeBucket ? "bg-clay text-white" : "border border-line bg-white text-ink hover:bg-paper"
        }`}
      >
        Any time
      </Link>
      {COOK_TIME_BUCKETS.map((bucket) => (
        <Link
          key={bucket.id}
          href={recipesHref({ q, cookbookId, category: activeCategory, timeBucket: bucket.id })}
          className={`rounded-full px-3 py-1.5 text-sm no-underline ${
            activeTimeBucket === bucket.id
              ? "bg-clay text-white"
              : "border border-line bg-white text-ink hover:bg-paper"
          }`}
        >
          {bucket.label}
        </Link>
      ))}
    </div>
  );
}

export function RecipeBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl rounded-tl-none border border-line bg-paper p-5 shadow-[inset_0_1px_0_rgb(255_255_255/60%)]">
      {children}
    </div>
  );
}
