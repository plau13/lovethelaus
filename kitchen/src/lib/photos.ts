import { and, asc, eq, max, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { canEditRecipe } from "@/lib/permissions";
import { deleteRecipePhotos, uploadRecipePhoto } from "@/lib/recipe-photos";

export { coverPhoto, orderedPhotos, type PhotoLike } from "@/lib/cover-photo";

const { recipe, recipePhoto, recipeCollaborator } = schema;

async function assertCanEdit(recipeId: string, userId: string) {
  const db = getDb();
  const target = await db.query.recipe.findFirst({
    where: eq(recipe.id, recipeId),
    columns: { id: true, ownerId: true },
    with: { collaborators: { where: eq(recipeCollaborator.userId, userId), columns: { role: true } } },
  });
  if (
    !target ||
    !canEditRecipe({
      userId,
      recipeOwnerId: target.ownerId,
      collaboratorRole: target.collaborators[0]?.role ?? null,
    })
  ) {
    throw new Error("You do not have edit access to this recipe.");
  }
  return target;
}

/** Upload a photo and append it to the recipe. The first one becomes the cover. */
export async function addRecipePhoto(args: {
  userId: string;
  recipeId: string;
  file: File;
  alt?: string | null;
}) {
  await assertCanEdit(args.recipeId, args.userId);
  const db = getDb();

  const [{ highest }] = await db
    .select({ highest: max(recipePhoto.position) })
    .from(recipePhoto)
    .where(eq(recipePhoto.recipeId, args.recipeId));

  const { key, contentType } = await uploadRecipePhoto(args.recipeId, args.file);
  const [created] = await db
    .insert(recipePhoto)
    .values({
      recipeId: args.recipeId,
      path: key,
      contentType,
      alt: (args.alt ?? "").trim() || "Finished dish",
      position: highest === null ? 0 : Number(highest) + 1,
    })
    .returning();

  // A recipe with no cover yet adopts its first photo, so there is always one.
  await db
    .update(recipe)
    .set({ coverPhotoId: created.id })
    .where(and(eq(recipe.id, args.recipeId), sql`${recipe.coverPhotoId} is null`));

  return created;
}

/** Remove a photo, deleting the R2 object before the row. */
export async function removeRecipePhoto(photoId: string, userId: string): Promise<string> {
  const db = getDb();
  const photo = await db.query.recipePhoto.findFirst({
    where: eq(recipePhoto.id, photoId),
    columns: { id: true, path: true, recipeId: true },
  });
  if (!photo) {
    throw new Error("That photo is already gone.");
  }
  await assertCanEdit(photo.recipeId, userId);

  await deleteRecipePhotos([photo.path]);
  // The cover FK is ON DELETE SET NULL, so the recipe falls back on its own.
  await db.delete(recipePhoto).where(eq(recipePhoto.id, photoId));
  return photo.recipeId;
}

/** Choose which photo leads the recipe, the cookbook card and the OG image. */
export async function setCoverPhoto(photoId: string, userId: string): Promise<string> {
  const db = getDb();
  const photo = await db.query.recipePhoto.findFirst({
    where: eq(recipePhoto.id, photoId),
    columns: { id: true, recipeId: true },
  });
  if (!photo) {
    throw new Error("That photo is already gone.");
  }
  await assertCanEdit(photo.recipeId, userId);
  await db.update(recipe).set({ coverPhotoId: photo.id }).where(eq(recipe.id, photo.recipeId));
  return photo.recipeId;
}

export async function setPhotoAlt(photoId: string, userId: string, alt: string): Promise<string> {
  const db = getDb();
  const photo = await db.query.recipePhoto.findFirst({
    where: eq(recipePhoto.id, photoId),
    columns: { id: true, recipeId: true },
  });
  if (!photo) {
    throw new Error("That photo is already gone.");
  }
  await assertCanEdit(photo.recipeId, userId);
  await db
    .update(recipePhoto)
    .set({ alt: alt.trim() || "Finished dish" })
    .where(eq(recipePhoto.id, photoId));
  return photo.recipeId;
}

export async function listRecipePhotos(recipeId: string) {
  const db = getDb();
  return db.query.recipePhoto.findMany({
    where: eq(recipePhoto.recipeId, recipeId),
    orderBy: [asc(recipePhoto.position), asc(recipePhoto.createdAt)],
  });
}
