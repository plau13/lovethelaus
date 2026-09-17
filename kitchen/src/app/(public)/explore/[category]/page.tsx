import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECIPE_CATEGORIES, type RecipeCategory } from "@/lib/types";
import { ExploreView, exploreMetadata } from "../ExploreView";

// Uses searchParams (?page=), so it renders on demand; recipe and cookbook pages are the ISR-cached ones.

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ page?: string }> };

function parseCategory(raw: string): RecipeCategory | null {
  return RECIPE_CATEGORIES.find((entry) => entry === raw) ?? null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ category: raw }, { page }] = await Promise.all([params, searchParams]);
  const category = parseCategory(raw);
  if (!category) {
    return { title: "Not found" };
  }
  return exploreMetadata(category, Number.parseInt(page ?? "1", 10) || 1);
}

export default async function ExploreCategoryPage({ params, searchParams }: Props) {
  const [{ category: raw }, { page }] = await Promise.all([params, searchParams]);
  const category = parseCategory(raw);
  if (!category) {
    notFound();
  }
  return <ExploreView category={category} pageParam={page} />;
}
