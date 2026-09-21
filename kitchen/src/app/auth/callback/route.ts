import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { postAuthPath } from "@/lib/post-auth";
import { appPath, originUrl } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Single landing spot after any sign-in (form post, magic link, invite). Reads the fresh
 * session and applies the onboarding / returnTo rule. Not signed in → sign-in page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");
  const user = await getCurrentUser({ fresh: true });
  if (!user) {
    return NextResponse.redirect(
      originUrl(request, appPath("/sign-in?error=Sign-in%20did%20not%20complete.%20Try%20again.")),
    );
  }
  return NextResponse.redirect(originUrl(request, appPath(postAuthPath(user, returnTo))));
}
