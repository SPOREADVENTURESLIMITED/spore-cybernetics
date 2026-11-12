import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/client/client";
import { serviceSeed } from "../lib/catalog";

const connectionString = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!connectionString) throw new Error("DATABASE_URL is required.");
if (!email || !password || password.length < 16) {
  throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 16 characters.");
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
