import type { NextRequest } from "next/server";
import { authErrorMessage, signIn } from "@/lib/auth";
import { demoEmail, demoPassword } from "@/lib/demo-account";
import { appPath, errorRedirect, redirectWithCookies } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * "Try the demo": signs in with the account `npm run db:seed:demo` created.
 * Both read the address through `demo-account`, so the default works without
 * DEMO_USER_EMAIL being set in two places; only the password has to be a
 * secret here, and without it the button honestly says it is unavailable.
 */
export async function GET(request: NextRequest) {
  const email = demoEmail(process.env);
  const password = demoPassword(process.env);

  if (!password) {
    return errorRedirect(request, appPath("/sign-in"), "demo-unavailable");
  }

  try {
    const { setCookies } = await signIn(email, password, request.headers);
    return redirectWithCookies(request, appPath("/recipes"), setCookies);
  } catch (error) {
    return errorRedirect(request, appPath("/sign-in"), authErrorMessage(error));
  }
}
