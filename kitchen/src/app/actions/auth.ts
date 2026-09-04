"use server";

import { redirect } from "next/navigation";
import { authErrorMessage, getCurrentUser, signIn, signInWithMagicLink, signOut, signUp, requestPasswordReset } from "@/lib/auth";

async function postAuthRedirect(): Promise<string> {
  const user = await getCurrentUser();
  if (user && !user.onboardingCompletedAt) {
    return "/onboarding";
  }
  return "/recipes";
}

export async function signUpAction(formData: FormData) {
  try {
    await signUp(
      String(formData.get("name") ?? ""),
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? "")
    );
  } catch (error) {
    redirect(`/sign-up?error=${encodeURIComponent(authErrorMessage(error))}`);
  }
  redirect(await postAuthRedirect());
}

export async function signInAction(formData: FormData) {
  try {
    await signIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    redirect(`/sign-in?error=${encodeURIComponent(authErrorMessage(error))}`);
  }
  redirect(await postAuthRedirect());
}

export async function magicLinkAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/sign-in");
  try {
    await signInWithMagicLink(String(formData.get("email") ?? ""));
  } catch (error) {
    const separator = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${separator}error=${encodeURIComponent(authErrorMessage(error))}`);
  }
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}sent=magic-link`);
}

export async function requestPasswordResetAction(formData: FormData) {
  try {
    await requestPasswordReset(String(formData.get("email") ?? ""));
  } catch (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(authErrorMessage(error))}`);
  }
  redirect("/forgot-password?sent=1");
}

export async function logOut() {
  await signOut();
  redirect("/sign-in");
}
