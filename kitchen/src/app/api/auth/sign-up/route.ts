import { NextRequest, NextResponse } from "next/server";
import { authErrorMessage, getCurrentUser, signUp } from "@/lib/auth";

function redirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/sign-up");

  try {
    await signUp(name, email, password);
    const user = await getCurrentUser();
    const destination = user && !user.onboardingCompletedAt ? "/kitchen/onboarding" : "/kitchen/recipes";
    return NextResponse.redirect(redirectUrl(request, destination));
  } catch (error) {
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      redirectUrl(request, `${returnTo}${separator}error=${encodeURIComponent(authErrorMessage(error))}`)
    );
  }
}
