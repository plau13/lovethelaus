import { describe, expect, it } from "vitest";
import { detectSourceType, draftFromSocial, oembedEndpoint, structureCaption } from "./import-social";

describe("detectSourceType", () => {
  it("recognizes Instagram and TikTok hosts", () => {
    expect(detectSourceType("https://www.instagram.com/reel/abc/")).toBe("instagram");
    expect(detectSourceType("https://www.tiktok.com/@cook/video/123")).toBe("tiktok");
    expect(detectSourceType("https://smittenkitchen.com/pie")).toBe("blog");
  });
});

describe("oembedEndpoint", () => {
  it("points TikTok at the official oEmbed URL and never a download URL", () => {
    const endpoint = oembedEndpoint("https://www.tiktok.com/@cook/video/123");
    expect(endpoint).toContain("https://www.tiktok.com/oembed?url=");
    expect(endpoint).not.toContain("download");
  });
});

describe("structureCaption", () => {
  it("puts measured lines in ingredients", () => {
    const result = structureCaption("Marry me chicken\n2 cups cream\n1 lb chicken\nSimmer until thick.");
    expect(result.ingredients).toContain("2 cups cream");
    expect(result.steps).toContain("Simmer until thick.");
  });
});

describe("draftFromSocial", () => {
  it("keeps the original URL as attribution and does not invent a video file", () => {
    const draft = draftFromSocial({
      url: "https://www.instagram.com/reel/abc/",
      title: "Garlic noodles",
      authorName: "Uncle Ken",
      caption: "8 oz noodles\nToss with garlic butter.",
    });
    expect(draft.sourceType).toBe("instagram");
    expect(draft.sourceUrl).toBe("https://www.instagram.com/reel/abc/");
    expect(draft.attribution).toContain("Uncle Ken");
    expect(JSON.stringify(draft)).not.toMatch(/\.mp4/);
  });
});
