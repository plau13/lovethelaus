import { NextResponse, type NextRequest } from "next/server";
import { signInWithMagicLink } from "@/lib/auth";
import { errorRedirect, formReturnTo, originUrl, withQuery } from "@/lib/route-helpers";
import { safeReturnTo } from "@/lib/post-auth";

export const dynamic = "force-dynamic";

/** A bare GET (someone opening the action URL) goes to the one-time sign-in page instead of a 405. */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(originUrl(request, "/sign-in/one-time"));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = formReturnTo(formData, "/sign-in");
  const next = safeReturnTo(String(formData.get("next") ?? ""));

  try {
    await signInWithMagicLink(String(formData.get("email") ?? ""), next, request.headers);
    return NextResponse.redirect(originUrl(request, withQuery(returnTo, "sent", "magic-link")), 303);
  } catch (error) {
    return errorRedirect(request, returnTo, error, "auth.magic_link_failed", { report: false });
  }
}
