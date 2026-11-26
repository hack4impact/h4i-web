import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "db"]);

// Refuses non-local databases unless the named env var is "true" (Railway sets it).
export function assertLocalDatabase(
  action: string,
  allowEnv: string,
  url = process.env.DATABASE_URL
): string {
  if (!url) throw new Error(`DATABASE_URL is required to ${action}`);
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host) && process.env[allowEnv] !== "true") {
    throw new Error(
      `Refusing to ${action} on non-local database host "${host}". ` +
        `Set ${allowEnv}=true if that is intended (e.g. on Railway).`
    );
  }
  return url;
}
