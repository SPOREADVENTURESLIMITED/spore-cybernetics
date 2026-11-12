import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/client/client";
import { serviceSeed } from "../lib/catalog";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const connectionString = requiredEnv("DATABASE_URL");
const email = requiredEnv("ADMIN_EMAIL").trim().toLowerCase();
const password = requiredEnv("ADMIN_PASSWORD");

if (password.length < 16) {
  throw new Error("ADMIN_PASSWORD must be at least 16 characters.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  for (let i = 0; i < serviceSeed.length; i++) {
    const [name, category, summary, description, icon, featured] = serviceSeed[i];
    const slug = String(name)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await prisma.service.upsert({
      where: { slug },
      update: {},
      create: { name, category, summary, description, icon, featured, sortOrder: i, slug },
    });
  }

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      name: "Spore Administrator",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });

  console.log("Initial services and administrator seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
