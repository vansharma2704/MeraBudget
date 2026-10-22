import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  // Use a fallback URL during build to avoid Prisma 7 initialization errors
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres";
  
  // The DB is far away: opening a connection costs ~3s, so keep idle connections around
  // (pg's default closes them after 10s) and keep the sockets alive.
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 5 * 60 * 1000,
    keepAlive: true,
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis;

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
