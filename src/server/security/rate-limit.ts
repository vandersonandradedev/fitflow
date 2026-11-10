import { prisma } from "@/lib/db";
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

/**
 * Contador de janela fixa persistido no Postgres (compartilhado entre instâncias serverless).
 * Um único INSERT ... ON CONFLICT torna o incremento atômico e totalmente parametrizado.
 * Lança RateLimitError quando o limite é excedido.
 */
export async function enforceRateLimit(rule: RateLimitRule, identifier: string): Promise<void> {
  const key = `${rule.scope}:${identifier.toLowerCase()}`.slice(0, 255);
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

/** Zera o contador após sucesso (ex.: login correto não deve penalizar o usuário legítimo). */
export async function resetRateLimit(rule: RateLimitRule, identifier: string): Promise<void> {
  const key = `${rule.scope}:${identifier.toLowerCase()}`.slice(0, 255);
  await prisma.rateLimit.deleteMany({ where: { key } });
}
