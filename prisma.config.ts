// @ts-nocheck
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Fallback so `prisma generate` works during installs (e.g. Vercel postinstall)
// even before the DATABASE_URL environment variable is injected.
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
