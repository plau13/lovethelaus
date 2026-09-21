import { getAuth } from "@/lib/better-auth";

export const dynamic = "force-dynamic";

/**
 * OpenNext on Cloudflare fails to route `/api/auth/dash/validate` in production
 * even though the nested route exists locally. This flat alias restores the
 * path Better Auth expects before handing off to the handler.
 */
async function forward(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/kitchen/api/auth/dash/validate";
  return getAuth().handler(new Request(url, request));
}

export const GET = forward;
export const POST = forward;
