import { PrismaClient } from "@prisma/client";
import { getConnectionString } from "@netlify/database";

// A single PrismaClient per process. On serverless (hosted deployments) modules
// are re-used across warm invocations, so we cache the client on `globalThis`
// to avoid exhausting the database connection pool with a new client per call.
const globalForPrisma = globalThis as unknown as { __wwPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.__wwPrisma ??
  new PrismaClient({
    ...(process.env.NETLIFY_DB_URL ? { datasources: { db: { url: getConnectionString() } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.__wwPrisma = prisma;
