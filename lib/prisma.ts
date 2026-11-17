import { env } from "cloudflare:workers";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/client/client";

/**
 * Cloudflare Workers have request-scoped async contexts. A module-level
 * PrismaClient/Neon pool can carry pending promises from one invocation into
 * another; workerd cancels those continuations and may fail the request with
 * Error 1101. Create an isolated client for each database operation instead.
 *
 * DATABASE_URL must be the pooled Neon connection string. Each operation is
 * awaited before its client is disconnected, so no database promise is left
 * running in a later request context.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Cloudflare DATABASE_URL secret is not configured.");
  }
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}

async function withPrismaClient<T>(
  operation: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  const client = createPrismaClient();
  try {
    return await operation(client);
  } finally {
    await client.$disconnect();
  }
}

/**
 * Preserve prisma.model.operation call sites without sharing a PrismaClient
 * between Worker invocations. Use callback-style transactions so all work in
 * a transaction shares the same isolated client. Array-style transactions are
 * rejected because their PrismaPromises would belong to separate clients.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (typeof property === "symbol") return Reflect.get(_target, property);

    if (property === "$transaction") {
      return (first: unknown, ...rest: unknown[]) => {
        if (Array.isArray(first)) {
          return Promise.reject(
            new Error("Use callback-style Prisma transactions on Cloudflare Workers."),
          );
        }
        return withPrismaClient(async (client) => {
          const method = Reflect.get(client, property, client) as (...args: any[]) => Promise<unknown>;
          return await method.apply(client, [first, ...rest]);
        });
      };
    }

    if (property.startsWith("$")) {
      return (...args: unknown[]) =>
        withPrismaClient(async (client) => {
          const method = Reflect.get(client, property, client);
          if (typeof method !== "function") return method;
          return await method.apply(client, args);
        });
    }

    return new Proxy({}, {
      get(_delegate, operation) {
        if (typeof operation === "symbol") return undefined;
        return (...args: unknown[]) =>
          withPrismaClient(async (client) => {
            const delegate = Reflect.get(client, property, client);
            const method = Reflect.get(delegate, operation, delegate);
            if (typeof method !== "function") {
              throw new TypeError(`Unsupported Prisma operation: ${property}.${operation}`);
            }
            return await method.apply(delegate, args);
          });
      },
    });
  },
});
