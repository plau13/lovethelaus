import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { syncPrismaUserFromSupabase } from "@/lib/supabase-user-sync";
import { createClient } from "@/utils/supabase/server";

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000/kitchen";
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  const prisma = await getPrisma();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: authUser.id }, { email: authUser.email.toLowerCase() }],
    },
  });

  if (user) {
    return user;
  }

  return syncPrismaUserFromSupabase(authUser);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function signUp(nameRaw: string, emailRaw: string, password: string) {
  const name = nameRaw.trim() || emailRaw.split("@")[0] || "Family cook";
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Enter a real email address.");
  }
  if (password.length < 8) {
    throw new Error("Use at least 8 characters for your password.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error("Sign up failed. Try again.");
  }

  await syncPrismaUserFromSupabase(data.user);
}

export async function signIn(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Enter a real email address.");
  }
  if (!password) {
    throw new Error("Enter your password.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error("Sign in failed. Try again.");
  }

  await syncPrismaUserFromSupabase(data.user);
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
}

export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Enter a real email address.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signInWithMagicLink(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Enter a real email address.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Try again.";
}

export { ensureDefaultCookbook } from "@/lib/default-cookbook";
