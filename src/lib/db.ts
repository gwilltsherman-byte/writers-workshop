import { PrismaClient } from "@prisma/client";

// A single PrismaClient per process. On serverless (Netlify Functions) modules
// are re-used across warm invocations, so we cache the client on `globalThis`
// to avoid exhausting the database connection pool with a new client per call.
const globalForPrisma = globalThis as unknown as { __wwPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.__wwPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__wwPrisma = prisma;
