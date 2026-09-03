import { NextRequest, NextResponse } from "next/server";
import { authErrorMessage, signInWithMagicLink } from "@/lib/auth";
import { siteUrl } from "@/lib/request-url";

function redirectUrl(request: NextRequest, path: string): URL {
  return siteUrl(request, path);
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(redirectUrl(request, "/sign-in/one-time"));
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
