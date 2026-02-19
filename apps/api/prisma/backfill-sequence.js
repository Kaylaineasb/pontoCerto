require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  // IMPORTANTE: usa a mesma URL que você usa no Prisma/Nest
  // Se você está com 5433 no .env, vai pegar automaticamente.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const entries = await prisma.timeEntry.findMany({
    orderBy: { timestamp: "asc" },
    select: { id: true, orgId: true, userId: true, timestamp: true },
  });

  const groups = new Map();

  for (const e of entries) {
    const d = new Date(e.timestamp);
    d.setHours(0, 0, 0, 0);
    const key = `${e.orgId}:${e.userId}:${d.toISOString().slice(0, 10)}`;

    const arr = groups.get(key) || [];
    arr.push(e.id);
    groups.set(key, arr);
  }

  for (const [key, ids] of groups.entries()) {
    for (let i = 0; i < ids.length; i++) {
      await prisma.timeEntry.update({
        where: { id: ids[i] },
        data: { sequence: i + 1 },
      });
    }
    console.log(`✅ ${key} -> ${ids.length} registros atualizados`);
  }

  console.log("✅ backfill de sequence concluído");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("❌ backfill falhou:", e);
  process.exit(1);
});
