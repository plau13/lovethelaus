import { and, asc, count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { canAddMedia } from "@/lib/media-limits";
import { deleteMedia, uploadMedia, type MediaKind } from "@/lib/media-storage";
import { canEditRecipe } from "@/lib/permissions";
import { getRecipeForUser } from "@/lib/recipes";
import { isSubscriber } from "@/lib/subscription";

const { recipeMedia } = schema;

export async function listRecipeMedia(recipeId: string, kind?: MediaKind) {
  const db = getDb();
  return db.query.recipeMedia.findMany({
    where: kind ? and(eq(recipeMedia.recipeId, recipeId), eq(recipeMedia.kind, kind)) : eq(recipeMedia.recipeId, recipeId),
    with: { creator: { columns: { id: true, name: true } } },
    orderBy: [asc(recipeMedia.position), asc(recipeMedia.createdAt)],
  });
}

/** Upload a scanned card or voice memo. Editors only, and subject to the free-tier cap. */
export async function addRecipeMedia(args: {
  user: { id: string; subscriptionTier: string };
  recipeId: string;
  kind: MediaKind;
  file: File;
  caption?: string | null;
  durationSeconds?: number | null;
}) {
  const target = await getRecipeForUser(args.recipeId, args.user.id);
  if (
    !target ||
    !canEditRecipe({
      userId: args.user.id,
      recipeOwnerId: target.ownerId,
      collaboratorRole: target.collaboratorRole ?? null,
    })
  ) {
    throw new Error("You do not have edit access to this recipe.");
  }

  const db = getDb();
  const [{ total }] = await db
    .select({ total: count() })
    .from(recipeMedia)
    .where(and(eq(recipeMedia.recipeId, args.recipeId), eq(recipeMedia.kind, args.kind)));

  const allowance = canAddMedia({
    kind: args.kind,
    existingCount: Number(total),
    subscriber: isSubscriber(args.user),
  });
  if (!allowance.allowed) {
    throw new Error(allowance.reason);
  }

  const { key, contentType } = await uploadMedia(args.recipeId, args.kind, args.file);
  const [created] = await db
    .insert(recipeMedia)
    .values({
      recipeId: args.recipeId,
      kind: args.kind,
      r2Key: key,
      contentType,
      caption: (args.caption ?? "").trim(),
      durationSeconds: args.durationSeconds && args.durationSeconds > 0 ? Math.round(args.durationSeconds) : null,
      position: Number(total),
      createdBy: args.user.id,
    })
    .returning();
  return created;
}

/** The person who added it, or the recipe owner, can remove it. */
export async function removeRecipeMedia(id: string, userId: string) {
  const db = getDb();
  const media = await db.query.recipeMedia.findFirst({
    where: eq(recipeMedia.id, id),
    with: { recipe: { columns: { id: true, ownerId: true } } },
  });
  if (!media || (media.createdBy !== userId && media.recipe.ownerId !== userId)) {
    throw new Error("Only the person who added this, or the recipe owner, can remove it.");
  }
  await deleteMedia([media.r2Key]);
  await db.delete(recipeMedia).where(eq(recipeMedia.id, id));
  return media.recipe.id;
}

export async function saveMediaCaption(id: string, userId: string, caption: string) {
  const db = getDb();
  const media = await db.query.recipeMedia.findFirst({
    where: eq(recipeMedia.id, id),
    with: { recipe: { columns: { id: true, ownerId: true } } },
  });
  if (!media || (media.createdBy !== userId && media.recipe.ownerId !== userId)) {
    throw new Error("You cannot edit this caption.");
  }
  await db.update(recipeMedia).set({ caption: caption.trim() }).where(eq(recipeMedia.id, id));
  return media.recipe.id;
}

export async function setMediaTranscript(id: string, transcript: string) {
  const db = getDb();
  await db.update(recipeMedia).set({ transcript, transcribedAt: new Date() }).where(eq(recipeMedia.id, id));
}

export async function getMedia(id: string) {
  const db = getDb();
  return db.query.recipeMedia.findFirst({
    where: eq(recipeMedia.id, id),
    with: { recipe: { columns: { id: true, ownerId: true, ingredients: true, steps: true } } },
  });
}
