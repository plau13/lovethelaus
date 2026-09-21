import type { NextRequest } from "next/server";
import { signIn } from "@/lib/auth";
import { appPath, errorRedirect, formReturnTo, redirectWithCookies, withQuery } from "@/lib/route-helpers";
import { safeReturnTo } from "@/lib/post-auth";
import { breadcrumb } from "@/lib/sentry-breadcrumb";

export const dynamic = "force-dynamic";

/** Form POST adapter used by the marketing site's /sign-in page and Kitchen's own form. */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = formReturnTo(formData, "/sign-in");
  const next = safeReturnTo(String(formData.get("next") ?? ""));

  try {
    const { setCookies } = await signIn(
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? ""),
      request.headers
    );
    breadcrumb("auth.sign_in", { outcome: "success" });
    const callback = next ? withQuery(appPath("/auth/callback"), "returnTo", next) : appPath("/auth/callback");
    return redirectWithCookies(request, callback, setCookies);
  } catch (error) {
    return errorRedirect(request, returnTo, error, "auth.sign_in_failed", { report: false });
  }
}
