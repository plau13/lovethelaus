import { describe, expect, it } from "vitest";
import {
  FREE_SCANS_PER_RECIPE,
  FREE_VOICE_PER_RECIPE,
  canAddMedia,
  formatDuration,
  freeLimitFor,
  mediaKindLabel,
} from "./media-limits";

describe("freeLimitFor", () => {
  it("reports the per-kind free allowance", () => {
    expect(freeLimitFor("scan")).toBe(FREE_SCANS_PER_RECIPE);
    expect(freeLimitFor("voice")).toBe(FREE_VOICE_PER_RECIPE);
  });
});

describe("canAddMedia", () => {
  it("lets a free account add the first of each kind", () => {
    expect(canAddMedia({ kind: "scan", existingCount: 0, subscriber: false })).toEqual({
      allowed: true,
      reason: "",
    });
    expect(canAddMedia({ kind: "voice", existingCount: 0, subscriber: false })).toEqual({
      allowed: true,
      reason: "",
    });
  });

  it("blocks a free account at the boundary and explains why", () => {
    const scan = canAddMedia({ kind: "scan", existingCount: 1, subscriber: false });
    expect(scan.allowed).toBe(false);
    expect(scan.reason).toContain("card photo");
    expect(scan.reason).toContain("Kitchen Plus");

    const voice = canAddMedia({ kind: "voice", existingCount: 1, subscriber: false });
    expect(voice.allowed).toBe(false);
    expect(voice.reason).toContain("voice memo");
  });

  it("never blocks a subscriber", () => {
    expect(canAddMedia({ kind: "scan", existingCount: 25, subscriber: true }).allowed).toBe(true);
    expect(canAddMedia({ kind: "voice", existingCount: 25, subscriber: true }).allowed).toBe(true);
  });
});

describe("mediaKindLabel", () => {
  it("names each block the way the recipe page does", () => {
    expect(mediaKindLabel("scan")).toBe("The original card");
    expect(mediaKindLabel("voice")).toBe("In their own voice");
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(9)).toBe("0:09");
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(0)).toBe("");
    expect(formatDuration(-4)).toBe("");
    expect(formatDuration(Number.NaN)).toBe("");
  });
});
