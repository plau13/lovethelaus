import { NextRequest, NextResponse } from "next/server";
import { authErrorMessage, signIn } from "@/lib/auth";

function redirectUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.url);
}

export async function GET(request: NextRequest) {
  const email = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD?.trim();

  if (!email || !password) {
    return NextResponse.redirect(redirectUrl(request, "/kitchen/sign-in?error=demo-unavailable"));
  }

  try {
    await signIn(email, password);
  } catch (error) {
    const message = encodeURIComponent(authErrorMessage(error));
    return NextResponse.redirect(redirectUrl(request, `/kitchen/sign-in?error=${message}`));
  }

  return NextResponse.redirect(redirectUrl(request, "/kitchen/recipes"));
}
