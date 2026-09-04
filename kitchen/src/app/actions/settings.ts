"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { fullName } from "@/lib/user-name";
import { PREFERRED_UNITS } from "@/lib/types";

export async function updateProfile(formData: FormData) {
  const prisma = await getPrisma();
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
  await prisma.user.update({
    where: { id: user.id },
    data: { firstName, lastName, name, preferredUnits },
  });
  redirect("/settings?saved=1");
}
