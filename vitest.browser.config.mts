import { defineConfig } from "vitest/config";

// Explicit opt-in: requires a running local app connected to the same isolated
// DATABASE_URL. Do not load .env.local (which usually points at the normal DB).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/projects.browser.int.test.ts"],
    fileParallelism: false,
    testTimeout: 180_000,
  },
});
