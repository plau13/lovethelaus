"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildRecipesQuery, type RecipeFilterParams } from "@/lib/recipe-filters";
import {
  COOK_TIME_BUCKETS,
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  categoryLabel,
  difficultyLabel,
  type RecipeCategory,
  type RecipeDifficulty,
} from "@/lib/types";

type CookbookOption = { id: string; title: string };

type RecipeFiltersBarProps = RecipeFilterParams & {
  cookbooks: CookbookOption[];
};

const selectClass =
  "min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-ink sm:flex-none sm:min-w-[9rem]";

export function RecipeFiltersBar({
  q = "",
  category = "",
  time = "",
  cookbook = "",
  difficulty = "",
  cookbooks,
}: RecipeFiltersBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const navigate = useCallback(
    (next: Partial<RecipeFilterParams>) => {
      router.replace(
        buildRecipesQuery({
          q,
          category,
          time,
          cookbook,
          difficulty,
          ...next,
        })
      );
    },
    [router, q, category, time, cookbook, difficulty]
  );

  useEffect(() => {
    if (search === q) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      navigate({ q: search });
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, q, navigate]);

  return (
    <div className="no-print grid gap-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(event) =>
            navigate({ category: event.target.value as RecipeCategory | "" })
          }
          className={selectClass}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {RECIPE_CATEGORIES.map((entry) => (
            <option key={entry} value={entry}>
              {categoryLabel(entry)}
            </option>
          ))}
        </select>

        <select
          value={time}
          onChange={(event) => navigate({ time: event.target.value })}
          className={selectClass}
          aria-label="Cook time"
        >
          <option value="">Any time</option>
          {COOK_TIME_BUCKETS.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>
              {bucket.label}
            </option>
          ))}
        </select>

        <select
          value={cookbook}
          onChange={(event) => navigate({ cookbook: event.target.value })}
          className={selectClass}
          aria-label="Cookbook"
        >
          <option value="">All cookbooks</option>
          {cookbooks.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(event) =>
            navigate({ difficulty: event.target.value as RecipeDifficulty | "" })
          }
          className={selectClass}
          aria-label="Difficulty"
        >
          <option value="">Any difficulty</option>
          {RECIPE_DIFFICULTIES.map((entry) => (
            <option key={entry} value={entry}>
              {difficultyLabel(entry)}
            </option>
          ))}
        </select>
      </div>

      <label className="grid gap-1">
        <span className="text-muted">Search (title, ingredients, tags)</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-3"
          placeholder="chicken mushrooms"
        />
      </label>
    </div>
  );
}
