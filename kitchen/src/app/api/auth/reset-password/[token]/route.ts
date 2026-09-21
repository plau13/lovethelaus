import { NextResponse } from "next/server";
import { appPath, originUrl } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

/**
 * Better Auth emails link here. OpenNext on Cloudflare does not reliably reach
 * the `[...all]` catch-all for this path, so we redirect to the reset form.
 */
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const url = new URL(request.url);
  const callback = url.searchParams.get("callbackURL")?.trim();
  const path =
    callback && callback.startsWith("/") && !callback.startsWith("//") ? callback : appPath("/reset-password");
  const dest = originUrl(request, path);
  dest.searchParams.set("token", token);
  return NextResponse.redirect(dest, 303);
}
