import { prisma } from "@/lib/db";
import { getRedisClient } from "@/lib/redis";
import { RateLimitError } from "@/server/errors";

interface RateLimitRule {
  /** Prefixo lógico da regra, ex.: "login:email". */
  scope: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  loginByEmail: { scope: "login:email", limit: 5, windowSeconds: 15 * 60 },
  loginByIp: { scope: "login:ip", limit: 30, windowSeconds: 15 * 60 },
  register: { scope: "register:ip", limit: 10, windowSeconds: 60 * 60 },
  passwordReset: { scope: "pwreset:email", limit: 3, windowSeconds: 60 * 60 },
  inviteCreate: { scope: "invite:user", limit: 30, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

const REDIS_FIXED_WINDOW_LUA = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
end
local ttl = redis.call("TTL", KEYS[1])
if ttl < 0 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
  ttl = tonumber(ARGV[1])
end
return { current, ttl }
`;

function buildKey(rule: RateLimitRule, identifier: string): string {
  return `${rule.scope}:${identifier.toLowerCase()}`.slice(0, 255);
}

async function enforceRateLimitPostgres(rule: RateLimitRule, key: string): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ count: number; window_start: Date }>>`
    INSERT INTO rate_limits ("key", "count", "window_start")
    VALUES (${key}, 1, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN rate_limits."window_start" < NOW() - make_interval(secs => ${rule.windowSeconds})
          THEN 1
        ELSE rate_limits."count" + 1
      END,
      "window_start" = CASE
        WHEN rate_limits."window_start" < NOW() - make_interval(secs => ${rule.windowSeconds})
          THEN NOW()
        ELSE rate_limits."window_start"
      END
    RETURNING "count", "window_start"
  `;

  const row = rows[0];
  if (row && row.count > rule.limit) {
    const elapsed = Math.floor((Date.now() - row.window_start.getTime()) / 1000);
    throw new RateLimitError(undefined, Math.max(1, rule.windowSeconds - elapsed));
  }
}

/**
 * Contador de janela fixa distribuído.
 * Usa Redis quando `REDIS_URL` está configurado e acessível (ex.: desenvolvimento/testes com Docker),
 * com fallback automático para PostgreSQL quando não há Redis disponível.
 */
export async function enforceRateLimit(rule: RateLimitRule, identifier: string): Promise<void> {
  const key = buildKey(rule, identifier);
  const redis = getRedisClient();

  if (redis) {
    try {
      const result = (await redis.eval(
        REDIS_FIXED_WINDOW_LUA,
        1,
        `rl:${key}`,
        rule.windowSeconds
      )) as [number, number];

      const count = Number(result[0]);
      const ttl = Number(result[1]);
      if (count > rule.limit) {
        throw new RateLimitError(undefined, Math.max(1, ttl > 0 ? ttl : rule.windowSeconds));
      }
      return;
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
      // Fallback seguro para Postgres se o container Redis estiver indisponível
    }
  }

  await enforceRateLimitPostgres(rule, key);
}

/** Zera o contador após sucesso (ex.: login correto não deve penalizar o usuário legítimo). */
export async function resetRateLimit(rule: RateLimitRule, identifier: string): Promise<void> {
  const key = buildKey(rule, identifier);
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.del(`rl:${key}`);
    } catch {
      // Ignora erro de conexão para seguir com limpeza no fallback
    }
  }

  await prisma.rateLimit.deleteMany({ where: { key } });
}
