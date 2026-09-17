import { deletePhoto, makeCoverPhoto } from "@/app/actions/photos";
import { PhotoUpload } from "@/components/photos/PhotoUpload";
import { photoUrl } from "@/lib/paths";
import { orderedPhotos, type PhotoLike } from "@/lib/cover-photo";

export type GalleryPhoto = PhotoLike;

/**
 * Every photo on a recipe, cover first. Before this the newest uploads were
 * invisible: only `photos[0]` was ever rendered.
 */
export function PhotoGallery({
  recipeId,
  coverPhotoId,
  photos,
  canEdit,
}: {
  recipeId: string;
  coverPhotoId: string | null;
  photos: GalleryPhoto[];
  canEdit: boolean;
}) {
  const ordered = orderedPhotos({ coverPhotoId, photos });

  if (!canEdit && ordered.length <= 1) {
    return null;
  }

  return (
    <section id="photos" className="no-print grid gap-3">
      <h2 className="text-xl font-semibold">Photos</h2>

      {ordered.length === 0 ? (
        <p className="text-muted">
          {canEdit ? "No photos yet. The first one you add becomes the cover." : "No photos yet."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {ordered.map((photo, index) => {
            const isCover = index === 0;
            return (
              <li key={photo.id} className="grid gap-2 rounded-2xl border border-line bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(photo.path)}
                  alt={photo.alt || "Recipe photo"}
                  loading="lazy"
                  className="h-48 w-full rounded-xl object-cover"
                />
                <p className="text-sm text-muted">
                  {isCover ? "Cover" : photo.alt || "Untitled"}
                </p>
                {canEdit ? (
                  <div className="flex flex-wrap gap-3">
                    {isCover ? null : (
                      <form action={makeCoverPhoto}>
                        <input type="hidden" name="photoId" value={photo.id} />
                        <button type="submit" className="min-h-0 text-sm text-clay">
                          Make this the cover
                        </button>
                      </form>
                    )}
                    <form action={deletePhoto}>
                      <input type="hidden" name="photoId" value={photo.id} />
                      <button type="submit" className="min-h-0 text-sm text-muted hover:text-clay">
                        Remove
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit ? <PhotoUpload recipeId={recipeId} hasPhotos={ordered.length > 0} /> : null}
    </section>
  );
}
