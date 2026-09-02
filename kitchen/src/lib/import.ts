import { structureWithOptionalAi } from "@/lib/import-ai";
import { extractRecipeFromHtml } from "@/lib/import-jsonld";
import { detectSourceType, draftFromSocial, oembedEndpoint } from "@/lib/import-social";
import type { ImportDraftShape } from "@/lib/types";

type OEmbed = {
  title?: string;
  author_name?: string;
  author_url?: string;
};

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "KitchenRecipeBox/1.0 (family recipe import; +https://localhost)",
      accept: "text/html,application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Could not open that link (${response.status}).`);
  }
  return response.text();
}

function ogTitle(html: string): string | undefined {
  const match = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  return match?.[1];
}

async function importSocial(url: string): Promise<ImportDraftShape> {
  const endpoint = oembedEndpoint(url);
  let title: string | undefined;
  let authorName: string | undefined;
  let caption: string | undefined;
  if (endpoint) {
    try {
      const raw = await fetchText(endpoint);
      const oembed = JSON.parse(raw) as OEmbed;
      title = oembed.title;
      authorName = oembed.author_name;
    } catch {
      // oEmbed is optional; the confirm screen still works.
    }
  }
  try {
    const html = await fetchText(url);
    caption = ogTitle(html);
  } catch {
    // Keep the URL even if the page is blocked.
  }
  const draft = draftFromSocial({ url, title, authorName, caption });
  return structureWithOptionalAi(draft);
}

export async function importFromUrl(urlRaw: string): Promise<ImportDraftShape> {
  let url: string;
  try {
    url = new URL(urlRaw.trim()).toString();
  } catch {
    throw new Error("Paste a full https:// link.");
  }
  const sourceType = detectSourceType(url);
  if (sourceType === "instagram" || sourceType === "tiktok") {
    return importSocial(url);
  }
  const html = await fetchText(url);
  const fromLd = extractRecipeFromHtml(html, url);
  if (fromLd) {
    return fromLd;
  }
  const title = ogTitle(html) || "Imported recipe";
  return structureWithOptionalAi({
    title,
    ingredients: "",
    steps: "Could not find a recipe card on that page. Paste ingredients and steps here.",
    attribution: url,
    sourceType: "blog",
    sourceUrl: url,
  });
}
