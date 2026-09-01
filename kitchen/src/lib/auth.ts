import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export const SESSION_COOKIE = "kitchen_session";

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requestMagicLink(emailRaw: string, nameRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const name = nameRaw.trim() || email.split("@")[0] || "Family cook";
  if (!email.includes("@")) {
    throw new Error("Enter a real email address.");
  }
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.magicLink.create({
    data: { email, token, expiresAt },
  });
  return { email, name, verifyUrl: `${appUrl()}/api/auth/verify?token=${token}&name=${encodeURIComponent(name)}` };
}

export async function consumeMagicLink(token: string, nameHint: string) {
  const link = await prisma.magicLink.findUnique({ where: { token } });
  if (!link || link.expiresAt < new Date()) {
    throw new Error("This sign-in link expired. Ask for a new one.");
  }
  const email = link.email;
  const user = await prisma.user.upsert({
    where: { email },
    update: nameHint ? { name: nameHint } : {},
    create: { email, name: nameHint || email.split("@")[0] || "Family cook" },
  });
  await prisma.magicLink.delete({ where: { id: link.id } });
  await ensureDefaultCookbook(user.id, user.name);
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId: user.id, token: sessionToken, expiresAt },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return user;
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function ensureDefaultCookbook(userId: string, name: string) {
  const existing = await prisma.cookbook.findFirst({
    where: { ownerId: userId, isDefault: true },
  });
  if (existing) {
    return existing;
  }
  const slug = `${slugify(name)}-recipes-${userId.slice(-6)}`;
  return prisma.cookbook.create({
    data: {
      ownerId: userId,
      title: "My recipes",
      description: "Private box for your recipes.",
      visibility: "private",
      slug,
      isDefault: true,
      members: { create: { userId, role: "owner" } },
    },
  });
}
