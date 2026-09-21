import { getAuth } from "@/lib/better-auth";

export const dynamic = "force-dynamic";

/** Better Auth Infrastructure ownership check — GET /kitchen/api/auth/dash/validate */
export async function GET(request: Request) {
  return getAuth().handler(request);
}
