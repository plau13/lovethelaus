import { describe, expect, it } from "vitest";
import { coverPhoto, orderedPhotos } from "./cover-photo";

const first = { id: "p1", path: "r/a.jpg", alt: "", position: 0 };
const second = { id: "p2", path: "r/b.jpg", alt: "", position: 1 };
const third = { id: "p3", path: "r/c.jpg", alt: "", position: 2 };

describe("coverPhoto", () => {
  it("returns the chosen cover", () => {
    expect(coverPhoto({ coverPhotoId: "p2", photos: [first, second, third] })).toEqual(second);
  });

  it("falls back to the lowest position when no cover is set", () => {
    expect(coverPhoto({ coverPhotoId: null, photos: [third, first, second] })).toEqual(first);
  });

  it("falls back when the chosen cover was deleted", () => {
    expect(coverPhoto({ coverPhotoId: "gone", photos: [second, third] })).toEqual(second);
  });

  it("returns null for a recipe with no photos", () => {
    expect(coverPhoto({ coverPhotoId: null, photos: [] })).toBeNull();
    expect(coverPhoto({ coverPhotoId: "p1", photos: [] })).toBeNull();
  });

  it("breaks a position tie on the key, so the order is stable", () => {
    const a = { id: "pa", path: "r/a.jpg", alt: "", position: 0 };
    const b = { id: "pb", path: "r/b.jpg", alt: "", position: 0 };
    expect(coverPhoto({ photos: [b, a] })).toEqual(a);
    expect(coverPhoto({ photos: [a, b] })).toEqual(a);
  });
});

describe("orderedPhotos", () => {
  it("puts the cover first and keeps the rest in position order", () => {
    const ordered = orderedPhotos({ coverPhotoId: "p3", photos: [second, first, third] });
    expect(ordered.map((photo) => photo.id)).toEqual(["p3", "p1", "p2"]);
  });

  it("orders by position when no cover is set", () => {
    const ordered = orderedPhotos({ coverPhotoId: null, photos: [third, second, first] });
    expect(ordered.map((photo) => photo.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("returns an empty list for a recipe with no photos", () => {
    expect(orderedPhotos({ coverPhotoId: null, photos: [] })).toEqual([]);
  });

  it("never drops or duplicates a photo", () => {
    const ordered = orderedPhotos({ coverPhotoId: "p2", photos: [first, second, third] });
    expect(ordered).toHaveLength(3);
    expect(new Set(ordered.map((photo) => photo.id)).size).toBe(3);
  });
});
