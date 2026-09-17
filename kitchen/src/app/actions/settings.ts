"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db/client";
import { refreshSessionCache, requireUser } from "@/lib/auth";
import { fullName } from "@/lib/user-name";
import { PREFERRED_UNITS } from "@/lib/types";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) {
    throw new Error("Enter your first and last name.");
  }
  const preferredUnits = String(formData.get("preferredUnits") ?? "us");
  if (!PREFERRED_UNITS.includes(preferredUnits as (typeof PREFERRED_UNITS)[number])) {
    throw new Error("Pick US or metric units.");
  }
  const name = fullName(firstName, lastName);
  const db = getDb();
  await db.update(schema.user).set({ firstName, lastName, name, preferredUnits }).where(eq(schema.user.id, user.id));
  await refreshSessionCache();
  redirect("/settings?saved=1");
}
