import path from "node:path";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// .env.local before .env, like Next.js
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
