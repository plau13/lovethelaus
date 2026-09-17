"use server";

import { redirect } from "next/navigation";
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
  const user = await requireUser();
  const created = await createPerson(user.id, inputFrom(formData));
  redirect(`/family/people/${created.id}`);
}

export async function updatePersonAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("personId") ?? "");
  await updatePerson(id, user.id, inputFrom(formData));
  redirect(`/family/people/${id}`);
}

export async function removePerson(formData: FormData) {
  const user = await requireUser();
  await deletePerson(String(formData.get("personId") ?? ""), user.id);
  redirect("/family");
}

export type InlinePersonState = { ok: boolean; id?: string; name?: string; relationship?: string | null; error?: string };

/** Used by the recipe editor's "Add someone" mini-form (useActionState). */
export async function createPersonInline(_previous: InlinePersonState, formData: FormData): Promise<InlinePersonState> {
  try {
    const user = await requireUser();
    const created = await createPerson(user.id, {
      name: String(formData.get("name") ?? ""),
      relationship: String(formData.get("relationship") ?? ""),
    });
    return { ok: true, id: created.id, name: created.name, relationship: created.relationship };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not add that person." };
  }
}
