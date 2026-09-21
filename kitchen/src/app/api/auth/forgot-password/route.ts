import { NextResponse, type NextRequest } from "next/server";
import { requestPasswordReset } from "@/lib/auth";
import { errorRedirect, formReturnTo, originUrl, withQuery } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = formReturnTo(formData, "/forgot-password");

  try {
    await requestPasswordReset(String(formData.get("email") ?? ""), request.headers);
    return NextResponse.redirect(originUrl(request, withQuery(returnTo, "sent", "1")), 303);
  } catch (error) {
    return errorRedirect(request, returnTo, error, "auth.password_reset_failed", { report: false });
  }
}
