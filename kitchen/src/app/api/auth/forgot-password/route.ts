import { NextRequest, NextResponse } from "next/server";
import { authErrorMessage, requestPasswordReset } from "@/lib/auth";

function redirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/forgot-password");

  try {
    await requestPasswordReset(email);
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(redirectUrl(request, `${returnTo}${separator}sent=1`));
  } catch (error) {
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      redirectUrl(request, `${returnTo}${separator}error=${encodeURIComponent(authErrorMessage(error))}`)
    );
  }
}
