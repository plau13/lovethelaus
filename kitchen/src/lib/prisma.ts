import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Uses DATABASE_URL from .env (Supabase transaction pooler).
// Migrations use DIRECT_URL via prisma/schema.prisma directUrl.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
