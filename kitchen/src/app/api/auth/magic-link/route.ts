import { NextRequest, NextResponse } from "next/server";
import { authErrorMessage, signInWithMagicLink } from "@/lib/auth";

function redirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/sign-in");

  try {
    await signInWithMagicLink(email);
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(redirectUrl(request, `${returnTo}${separator}sent=magic-link`));
  } catch (error) {
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      redirectUrl(request, `${returnTo}${separator}error=${encodeURIComponent(authErrorMessage(error))}`),
    );
  }
}
