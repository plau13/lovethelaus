/** Pure cover-photo selection, shared by the app pages, the public pages and SEO. */

export type PhotoLike = { id: string; path: string; alt: string; position: number };

/**
 * The photo to show for a recipe: the chosen cover when it still exists,
 * otherwise the first by position. Before this, every caller used `photos[0]`,
 * which made the oldest upload the cover by accident.
 */
export function coverPhoto<T extends PhotoLike>(
  recipeRow: { coverPhotoId?: string | null; photos: T[] },
): T | null {
  if (recipeRow.photos.length === 0) {
    return null;
  }
  const chosen = recipeRow.coverPhotoId
    ? recipeRow.photos.find((photo) => photo.id === recipeRow.coverPhotoId)
    : undefined;
  if (chosen) {
    return chosen;
  }
  return [...recipeRow.photos].sort(
    (a, b) => a.position - b.position || a.path.localeCompare(b.path),
  )[0];
}

/** Photos in display order, cover first. */
export function orderedPhotos<T extends PhotoLike>(recipeRow: {
  coverPhotoId?: string | null;
  photos: T[];
}): T[] {
  const cover = coverPhoto(recipeRow);
  const rest = recipeRow.photos
    .filter((photo) => photo.id !== cover?.id)
    .sort((a, b) => a.position - b.position || a.path.localeCompare(b.path));
  return cover ? [cover, ...rest] : rest;
}
