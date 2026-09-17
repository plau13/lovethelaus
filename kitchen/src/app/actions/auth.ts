"use server";

import { redirect } from "next/navigation";
import {
  authErrorMessage,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  signIn,
  signInWithMagicLink,
  signOut,
  signUp,
} from "@/lib/auth";
import { postAuthPath, safeReturnTo, withQuery } from "@/lib/post-auth";

async function afterAuth(returnTo?: string | null): Promise<never> {
  const user = await getCurrentUser({ fresh: true });
  redirect(postAuthPath(user, returnTo));
}

export async function signUpAction(formData: FormData) {
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? ""));
  try {
    await signUp(
      String(formData.get("name") ?? ""),
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? "")
    );
  } catch (error) {
    redirect(withQuery("/sign-up", "error", authErrorMessage(error)));
  }
  await afterAuth(returnTo);
}

export async function signInAction(formData: FormData) {
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? ""));
  try {
    await signIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    redirect(withQuery(returnTo ? withQuery("/sign-in", "returnTo", returnTo) : "/sign-in", "error", authErrorMessage(error)));
  }
  await afterAuth(returnTo);
}

export async function magicLinkAction(formData: FormData) {
  const back = safeReturnTo(String(formData.get("returnTo") ?? "")) ?? "/sign-in/one-time";
  const next = safeReturnTo(String(formData.get("next") ?? ""));
  try {
    await signInWithMagicLink(String(formData.get("email") ?? ""), next);
  } catch (error) {
    redirect(withQuery(back, "error", authErrorMessage(error)));
  }
  redirect(withQuery(back, "sent", "magic-link"));
}

export async function requestPasswordResetAction(formData: FormData) {
  try {
    await requestPasswordReset(String(formData.get("email") ?? ""));
  } catch (error) {
    redirect(withQuery("/forgot-password", "error", authErrorMessage(error)));
  }
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!token) {
    redirect(withQuery("/reset-password", "error", "That link is invalid or expired. Request a new one."));
  }
  if (password !== confirm) {
    redirect(withQuery(withQuery("/reset-password", "token", token), "error", "Passwords do not match."));
  }
  try {
    await resetPassword(token, password);
  } catch (error) {
    redirect(withQuery(withQuery("/reset-password", "token", token), "error", authErrorMessage(error)));
  }
  redirect("/sign-in?reset=1");
}

export async function logOut() {
  await signOut();
  redirect("/sign-in");
}
