import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Match Next.js: .env.local takes precedence over .env
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    // Test files share the seeded dev database and some of them write to it.
    fileParallelism: false,
  },
});
