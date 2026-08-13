import "dotenv/config";
import { defineConfig } from "@prisma/config";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn("⚠️ Warning: Neither DIRECT_URL nor DATABASE_URL is set in environment variables.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: dbUrl || "",
  },
  migrations: {
    seed: "npx tsx ./prisma/seed.ts",
  },
});