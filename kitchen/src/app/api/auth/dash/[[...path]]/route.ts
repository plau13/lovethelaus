import { getAuth } from "@/lib/better-auth";

export const dynamic = "force-dynamic";

/**
 * Better Auth Infrastructure dashboard APIs (`/dash/*`). OpenNext on Cloudflare
 * does not reliably reach the `[...all]` catch-all for these paths — same class
 * of issue as reset-password — so we forward explicitly.
 */
async function handle(request: Request) {
  return getAuth().handler(request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
