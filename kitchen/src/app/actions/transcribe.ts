"use server";

import { redirect } from "next/navigation";
import { redirectActionError } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { getMedia, setMediaTranscript } from "@/lib/media";
import { readMedia } from "@/lib/media-storage";
import { canEditRecipe } from "@/lib/permissions";
import { getRecipeForUser } from "@/lib/recipes";
import { isSubscriber } from "@/lib/subscription";
import { formatTranscript, transcribeRecipeCard } from "@/lib/transcribe-scan";

/** Card photos run to a few megabytes, so build the binary string in chunks. */
async function toBase64(stream: ReadableStream): Promise<string> {
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(offset, offset + CHUNK)));
  }
  return btoa(parts.join(""));
}

/** Kitchen Plus: read a scanned card with Claude and store the transcript on the media row. */
export async function transcribeScanAction(formData: FormData) {
  let userId: string | undefined;
  const recipeId = String(formData.get("recipeId") ?? "");
  try {
    const user = await requireUser({ fresh: true });
    userId = user.id;
    const mediaId = String(formData.get("mediaId") ?? "");

    if (!isSubscriber(user)) {
      throw new Error("Reading handwritten cards is part of Kitchen Plus.");
    }

    const target = await getRecipeForUser(recipeId, user.id);
    if (
      !target ||
      !canEditRecipe({ userId: user.id, recipeOwnerId: target.ownerId, collaboratorRole: target.collaboratorRole ?? null })
    ) {
      throw new Error("You do not have edit access to this recipe.");
    }

    const media = await getMedia(mediaId);
    if (!media || media.recipeId !== recipeId || media.kind !== "scan") {
      throw new Error("Card not found.");
    }

    const object = await readMedia(media.r2Key);
    if (!object) {
      throw new Error("That card photo is missing from storage.");
    }

    const result = await transcribeRecipeCard({
      base64: await toBase64(object.body),
      contentType: media.contentType ?? object.contentType,
    });
    await setMediaTranscript(mediaId, formatTranscript(result));

    redirect(`/recipes/${recipeId}#heritage-media`);
  } catch (error) {
    redirectActionError(recipeId ? `/recipes/${recipeId}` : "/recipes", error, "transcribe.scan_failed", userId);
  }
}
