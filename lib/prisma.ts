import { env } from "cloudflare:workers";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/client/client";

const globalForPrisma = globalThis as typeof globalThis & {
  sporePrisma?: PrismaClient;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.sporePrisma) {
    const connectionString = env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("Cloudflare DATABASE_URL secret is not configured.");
    }

    globalForPrisma.sporePrisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
    });
  }

  return globalForPrisma.sporePrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
