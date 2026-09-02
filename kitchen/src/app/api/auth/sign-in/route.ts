import { NextRequest, NextResponse } from "next/server";
import { authErrorMessage, signIn, signUp, requestPasswordReset } from "@/lib/auth";

function redirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/sign-in");

  try {
    await signIn(email, password);
    return NextResponse.redirect(redirectUrl(request, "/kitchen/recipes"));
  } catch (error) {
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      redirectUrl(request, `${returnTo}${separator}error=${encodeURIComponent(authErrorMessage(error))}`)
    );
  }
}
