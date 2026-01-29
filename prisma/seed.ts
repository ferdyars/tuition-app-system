import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.employee.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@school.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin:", admin.email);

  const cashier = await prisma.employee.upsert({
    where: { email: "cashier@school.com" },
    update: {},
    create: {
      name: "Default Cashier",
      email: "cashier@school.com",
      password: hashedPassword,
      role: "CASHIER",
    },
  });

  console.log("Created cashier:", cashier.email);

  const currentYear = "2024/2025";
  const academicYear = await prisma.academicYear.upsert({
    where: { year: currentYear },
    update: {},
    create: {
      year: currentYear,
      startDate: new Date("2024-07-01"),
      endDate: new Date("2025-06-30"),
      isActive: true,
    },
  });

  console.log("Created academic year:", academicYear.year);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
