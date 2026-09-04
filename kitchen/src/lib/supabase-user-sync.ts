import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getPrisma } from "@/lib/prisma";
import { ensureDefaultCookbook } from "@/lib/default-cookbook";
import { fullName, splitDisplayName } from "@/lib/user-name";

function displayName(authUser: SupabaseUser): string {
  const meta = authUser.user_metadata?.name;
  if (typeof meta === "string" && meta.trim()) {
    return meta.trim();
  }
  const email = authUser.email ?? "";
  return email.split("@")[0] || "Family cook";
}

export async function syncPrismaUserFromSupabase(authUser: SupabaseUser) {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Supabase user is missing an email address.");
  }

  const prisma = await getPrisma();
  const name = displayName(authUser);
  const { firstName, lastName } = splitDisplayName(name);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      authUserId: authUser.id,
      name,
      firstName,
      lastName,
    },
    create: {
      authUserId: authUser.id,
      email,
      name,
      firstName,
      lastName,
    },
  });

  await ensureDefaultCookbook(user.id, user.name);
  return user;
}
