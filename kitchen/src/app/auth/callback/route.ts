import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kitchenAppUrl, siteUrl } from "@/lib/request-url";
import { createClient } from "@/utils/supabase/server";
import { syncPrismaUserFromSupabase } from "@/lib/supabase-user-sync";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") ?? "/recipes";

  if (!code) {
    return NextResponse.redirect(siteUrl(request, "/sign-in?error=auth"));
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(siteUrl(request, "/sign-in?error=auth"));
  }

  await syncPrismaUserFromSupabase(data.user);

  const prisma = await getPrisma();
  const email = data.user.email?.trim().toLowerCase();
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.onboardingCompletedAt && next === "/recipes") {
      next = "/onboarding";
    }
  }

  return NextResponse.redirect(kitchenAppUrl(request, next));
}
