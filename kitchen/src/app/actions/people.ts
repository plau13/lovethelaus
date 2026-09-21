"use server";

import { redirect } from "next/navigation";
import { actionFail, redirectActionError } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { createPerson, deletePerson, updatePerson, type PersonInput } from "@/lib/people";

function inputFrom(formData: FormData): PersonInput {
  return {
    name: String(formData.get("name") ?? ""),
    relationship: String(formData.get("relationship") ?? ""),
    birthYear: String(formData.get("birthYear") ?? ""),
    passedYear: String(formData.get("passedYear") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  };
}

export async function savePerson(formData: FormData) {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const created = await createPerson(user.id, inputFrom(formData));
    redirect(`/family/people/${created.id}`);
  } catch (error) {
    redirectActionError("/family/people/new", error, "people.create_failed", userId);
  }
}

export async function updatePersonAction(formData: FormData) {
  let userId: string | undefined;
  const id = String(formData.get("personId") ?? "");
  try {
    const user = await requireUser();
    userId = user.id;
    await updatePerson(id, user.id, inputFrom(formData));
    redirect(`/family/people/${id}`);
  } catch (error) {
    redirectActionError(id ? `/family/people/${id}/edit` : "/family", error, "people.update_failed", userId);
  }
}

export async function removePerson(formData: FormData) {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    await deletePerson(String(formData.get("personId") ?? ""), user.id);
    redirect("/family");
  } catch (error) {
    redirectActionError("/family", error, "people.remove_failed", userId);
  }
}

export type InlinePersonState = { ok: boolean; id?: string; name?: string; relationship?: string | null; error?: string };

/** Used by the recipe editor's "Add someone" mini-form (useActionState). */
export async function createPersonInline(_previous: InlinePersonState, formData: FormData): Promise<InlinePersonState> {
  let userId: string | undefined;
  try {
    const user = await requireUser();
    userId = user.id;
    const created = await createPerson(user.id, {
      name: String(formData.get("name") ?? ""),
      relationship: String(formData.get("relationship") ?? ""),
    });
    return { ok: true, id: created.id, name: created.name, relationship: created.relationship };
  } catch (error) {
    return actionFail(error, "people.create_inline_failed", userId);
  }
}
