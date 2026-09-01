"use server";

import { redirect } from "next/navigation";
import { requireUser, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PREFERRED_UNITS } from "@/lib/types";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Enter a display name.");
  }
  const servingsRaw = String(formData.get("defaultServings") ?? "4").trim();
  const defaultServings = Number.parseInt(servingsRaw, 10);
  if (!Number.isFinite(defaultServings) || defaultServings < 1 || defaultServings > 12) {
    throw new Error("Default servings must be between 1 and 12.");
  }
  const preferredUnits = String(formData.get("preferredUnits") ?? "us");
  if (!PREFERRED_UNITS.includes(preferredUnits as (typeof PREFERRED_UNITS)[number])) {
    throw new Error("Pick US or metric units.");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { name, defaultServings, preferredUnits },
  });
  redirect("/settings?saved=1");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  const confirmEmail = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
  if (confirmEmail !== user.email) {
    throw new Error("Type your email exactly to confirm deletion.");
  }
  await signOut();
  await prisma.user.delete({ where: { id: user.id } });
  redirect("/");
}
