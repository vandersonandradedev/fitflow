import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { runDatabaseMaintenance } from "@/modules/maintenance/cleanup";

describe("Otimização de Banco de Dados — Housekeeping e Limpeza Periódica", () => {
  it("limpa tokens e rate-limits expirados sem afetar registros ativos", async () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 dias atrás
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // amanhã

    // Cria registro de rate limit expirado e ativo
    await prisma.rateLimit.createMany({
      data: [
        { key: "test:expired:1", count: 5, windowStart: pastDate },
        { key: "test:active:1", count: 2, windowStart: new Date() },
      ],
      skipDuplicates: true,
    });

    // Cria token de verificação expirado e ativo
    await prisma.verificationToken.createMany({
      data: [
        { identifier: "user:expired@test.com", token: "tok_exp_1", expires: pastDate },
        { identifier: "user:active@test.com", token: "tok_act_1", expires: futureDate },
      ],
      skipDuplicates: true,
    });

    // Executa a manutenção
    const report = await runDatabaseMaintenance();

    expect(report.expiredRateLimitsDeleted).toBeGreaterThanOrEqual(1);
    expect(report.expiredVerificationTokensDeleted).toBeGreaterThanOrEqual(1);

    // Verifica que o registro ativo permanece no banco
    const activeRate = await prisma.rateLimit.findUnique({
      where: { key: "test:active:1" },
    });
    expect(activeRate).not.toBeNull();

    const activeToken = await prisma.verificationToken.findUnique({
      where: { token: "tok_act_1" },
    });
    expect(activeToken).not.toBeNull();

    // Limpeza do teste
    await prisma.rateLimit.deleteMany({
      where: { key: { in: ["test:expired:1", "test:active:1"] } },
    });
    await prisma.verificationToken.deleteMany({
      where: { token: { in: ["tok_exp_1", "tok_act_1"] } },
    });
  });
});
