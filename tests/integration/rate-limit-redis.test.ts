import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { disconnectRedis, getRedisClient } from "@/lib/redis";
import { RateLimitError } from "@/server/errors";
import { enforceRateLimit, resetRateLimit } from "@/server/security/rate-limit";

describe("Rate limiting via Redis (Docker) com fallback para Postgres", () => {
  it("aplica janela fixa atomicamente no Redis, respeita TTL e limpa no reset", async () => {
    const redis = getRedisClient();
    expect(redis).not.toBeNull();

    const rule = { scope: "test:redis", limit: 2, windowSeconds: 60 };
    const id = "user-redis-1";

    await enforceRateLimit(rule, id);
    await enforceRateLimit(rule, id);

    // 3a tentativa deve ser bloqueada por RateLimitError
    await expect(enforceRateLimit(rule, id)).rejects.toBeInstanceOf(RateLimitError);

    // Deve ter gravado no Redis (com TTL positivo) e não no Postgres
    const rawVal = await redis!.get(`rl:${rule.scope}:${id}`);
    const ttl = await redis!.ttl(`rl:${rule.scope}:${id}`);
    expect(Number(rawVal)).toBe(3);
    expect(ttl).toBeGreaterThan(0);

    const pgCount = await prisma.rateLimit.count({ where: { key: `${rule.scope}:${id}` } });
    expect(pgCount).toBe(0);

    // Reset remove a chave do Redis e permite nova tentativa
    await resetRateLimit(rule, id);
    expect(await redis!.get(`rl:${rule.scope}:${id}`)).toBeNull();
    await expect(enforceRateLimit(rule, id)).resolves.toBeUndefined();
  });

  it("faz fallback para PostgreSQL quando REDIS_URL não está definido", async () => {
    const prevRedisUrl = process.env.REDIS_URL;
    await disconnectRedis();
    delete process.env.REDIS_URL;

    try {
      const rule = { scope: "test:pgfallback", limit: 1, windowSeconds: 60 };
      const id = "user-pg-1";

      await enforceRateLimit(rule, id);
      await expect(enforceRateLimit(rule, id)).rejects.toBeInstanceOf(RateLimitError);

      const pgRow = await prisma.rateLimit.findUnique({
        where: { key: `${rule.scope}:${id}` },
      });
      expect(pgRow?.count).toBe(2);

      await resetRateLimit(rule, id);
    } finally {
      if (prevRedisUrl !== undefined) {
        process.env.REDIS_URL = prevRedisUrl;
      }
    }
  });
});
