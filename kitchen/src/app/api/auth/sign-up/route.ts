import type { NextRequest } from "next/server";
import { authErrorMessage, signUp } from "@/lib/auth";
import { appPath, errorRedirect, formReturnTo, redirectWithCookies, withQuery } from "@/lib/route-helpers";
import { safeReturnTo } from "@/lib/post-auth";

export const dynamic = "force-dynamic";

/** Form POST adapter used by the marketing site's /sign-up page and Kitchen's own form. */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = formReturnTo(formData, "/sign-up");
  const next = safeReturnTo(String(formData.get("next") ?? ""));

  try {
    const { setCookies } = await signUp(
      String(formData.get("name") ?? ""),
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? ""),
      request.headers
    );
    const callback = next ? withQuery(appPath("/auth/callback"), "returnTo", next) : appPath("/auth/callback");
    return redirectWithCookies(request, callback, setCookies);
  } catch (error) {
    return errorRedirect(request, returnTo, authErrorMessage(error));
  }
}
