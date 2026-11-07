import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests only. *.int.test.ts run via `pnpm test:int`.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["**/*.int.test.ts", "node_modules/**"],
  },
});
