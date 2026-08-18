// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Configured with SSL and robust timeout parameters to prevent serverless dropouts
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000, // 10 second timeout fallback
  idleTimeoutMillis: 30000,      // Close idle clients after 30 seconds
  max: 10,                       // Limit pool connections to prevent saturation
});

// Handle pool-level errors safely so they don't crash the Node process
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});

const adapter = new PrismaPg(pool);

// Global singleton pattern for Next.js hot-reloading
const prismaClientSingleton = () => {
  return new PrismaClient({ 
    adapter,
    log: ["error", "warn"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;