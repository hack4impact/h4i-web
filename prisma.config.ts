import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
    // Optional: dedicated local shadow DB for `prisma migrate` diffing.
    // Never point this at shared/staging/production.
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
