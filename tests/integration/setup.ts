import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { __testOutbox } from "@/server/email";

// Trava de segurança: estes testes TRUNCAM todas as tabelas. Só rodam no banco de testes.
const url = process.env.DATABASE_URL ?? "";
if (!/\/fitflow_test(\?|$)/.test(url)) {
  throw new Error("Testes de integração recusados: DATABASE_URL não aponta para 'fitflow_test'.");
}

beforeEach(async () => {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  __testOutbox.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});
