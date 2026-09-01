"use server";

import { redirect } from "next/navigation";
import { requestMagicLink, signOut } from "@/lib/auth";

export async function requestSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  const result = await requestMagicLink(email, name);
  redirect(`/login?sent=1&link=${encodeURIComponent(result.verifyUrl)}`);
}

export async function logOut() {
  await signOut();
  redirect("/login");
}
