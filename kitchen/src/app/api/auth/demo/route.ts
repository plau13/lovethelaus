import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { demoEmail, demoPassword, demoRouteAccessAllowed } from "@/lib/demo-account";
import { appPath, errorRedirect, originUrl, redirectWithCookies } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Owner QA sign-in for the seeded demo account. Not linked in the UI — bookmark
 * `/kitchen/api/auth/demo?key=…` when `DEMO_ROUTE_SECRET` is set in production.
 */
export async function GET(request: NextRequest) {
  try {
    if (!demoRouteAccessAllowed(process.env, request.nextUrl.searchParams.get("key"))) {
      return NextResponse.redirect(originUrl(request, appPath("/sign-in")), 302);
    }

    const email = demoEmail(process.env);
    const password = demoPassword(process.env);

    if (!password) {
      return errorRedirect(
        request,
        appPath("/sign-in"),
        new AppError("auth.demo_unavailable", "The demo account is not set up right now."),
        "auth.demo_unavailable",
        { report: false },
      );
    }

    const { setCookies } = await signIn(email, password, request.headers);
    return redirectWithCookies(request, appPath("/auth/callback"), setCookies);
  } catch (error) {
    return errorRedirect(request, appPath("/sign-in"), error, "auth.demo_failed");
  }
}
