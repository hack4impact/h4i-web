import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Integration tests against DATABASE_URL. Serial, because files share one database.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
