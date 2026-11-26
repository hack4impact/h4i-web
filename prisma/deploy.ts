import { execFileSync } from "node:child_process";
import path from "node:path";
import { assertLocalDatabase } from "./db-guard";

assertLocalDatabase("apply migrations", "ALLOW_REMOTE_DEPLOY");

execFileSync(
  path.join("node_modules", ".bin", "prisma"),
  ["migrate", "deploy"],
  {
    stdio: "inherit",
  }
);
