import type { NextRequest } from "next/server";
import { authErrorMessage, signIn } from "@/lib/auth";
import { appPath, errorRedirect, redirectWithCookies } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/** "Try the demo": signs in with the seeded demo account (DEMO_USER_EMAIL / DEMO_USER_PASSWORD). */
export async function GET(request: NextRequest) {
  const email = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD?.trim();

  if (!email || !password) {
    return errorRedirect(request, appPath("/sign-in"), "demo-unavailable");
  }

  try {
    const { setCookies } = await signIn(email, password, request.headers);
    return redirectWithCookies(request, appPath("/recipes"), setCookies);
  } catch (error) {
    return errorRedirect(request, appPath("/sign-in"), authErrorMessage(error));
  }
}
