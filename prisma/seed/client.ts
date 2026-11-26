import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertLocalDatabase } from "../db-guard";

export function createSeedClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed with NODE_ENV=production");
  }
  const connectionString = assertLocalDatabase("seed", "ALLOW_REMOTE_SEED");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export type SeedClient = PrismaClient;
