import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

export const prisma = globalForPrisma.__opheliaPrisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__opheliaPrisma = prisma;
}
