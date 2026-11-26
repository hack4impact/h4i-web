// Expires pending claims past the timeout and returns their listings to
// AVAILABLE. Meant to run on a schedule, e.g. daily: `pnpm claims:expire`.
import { config } from "dotenv";

// Match Next.js: .env.local takes precedence over .env
config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  // Imported after the env is loaded, since the client reads DATABASE_URL.
  const { db } = await import("@/lib/db");
  const { CLAIM_TIMEOUT_DAYS, expireStaleClaims } =
    await import("@/lib/sourced-projects/claims");
  try {
    const expired = await expireStaleClaims();
    console.log(
      `Expired ${expired} pending claim(s) older than ${CLAIM_TIMEOUT_DAYS} days`
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
