import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const LEGACY_SEED_EMAILS = ["mom@laus.family", "dad@laus.family", "alex@laus.family"];

async function deleteSupabaseAuthUser(supabaseAdmin: SupabaseClient, email: string) {
  const normalized = email.toLowerCase();
  const { data: listed, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    throw listError;
  }
  const match = listed.users.find((entry) => entry.email?.toLowerCase() === normalized);
  if (!match) {
    console.log(`Supabase Auth: no user for ${email}`);
    return;
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(match.id);
  if (error) {
    throw error;
  }
  console.log(`Supabase Auth: deleted ${email}`);
}

async function deletePrismaUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`Prisma: no user for ${email}`);
    return;
  }

  await prisma.$transaction([
    prisma.importDraft.deleteMany({ where: { userId: user.id } }),
    prisma.interviewResponse.deleteMany({ where: { userId: user.id } }),
    prisma.recipeNote.deleteMany({ where: { userId: user.id } }),
    prisma.cookbookMember.deleteMany({ where: { userId: user.id } }),
    prisma.recipe.deleteMany({ where: { ownerId: user.id } }),
    prisma.cookbook.deleteMany({ where: { ownerId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  console.log(`Prisma: deleted ${email} and owned data`);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before purging.");
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const email of LEGACY_SEED_EMAILS) {
    await deletePrismaUserByEmail(email);
    await deleteSupabaseAuthUser(supabaseAdmin, email);
  }

  console.log("Purge complete: removed legacy @laus.family seed users");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
