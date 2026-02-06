const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { PrismaClient, Role } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não carregou. Verifique apps/api/.env");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const org = await prisma.organization.upsert({
    where: { name: "PontoCerto" },
    update: {},
    create: { name: "PontoCerto", timezone: "America/Maceio" },
  });

  const adminPass = await bcrypt.hash("admin123", 10);
  const userPass = await bcrypt.hash("user123", 10);

  await prisma.users.upsert({
    where: { orgId_email: { orgId: org.id, email: "admin@pontocerto.com" } },
    update: {},
    create: {
      orgId: org.id,
      name: "Admin",
      email: "admin@pontocerto.com",
      passwordHash: adminPass,
      role: Role.ADMIN,
    },
  });

  await prisma.users.upsert({
    where: { orgId_email: { orgId: org.id, email: "kay@pontocerto.com" } },
    update: {},
    create: {
      orgId: org.id,
      name: "Kay",
      email: "kay@pontocerto.com",
      passwordHash: userPass,
      role: Role.EMPLOYEE,
    },
  });

  console.log("✅ Seed concluído");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ Seed falhou:", e);
  process.exit(1);
});
