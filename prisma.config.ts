// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Note: Use your DIRECT_URL here if using pooled connections (e.g., Supabase, Neon) 
    // for CLI migrations and push commands.
    url: env("DIRECT_URL") ?? env("DATABASE_URL"),
  },
});