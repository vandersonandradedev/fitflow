import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
  redisUrl?: string;
};

/**
 * Retorna um cliente Redis singleton quando `REDIS_URL` está configurado.
 * Em produção serverless sem Redis provisionado, retorna `null` para manter
 * o fallback em PostgreSQL sem abrir conexões externas desnecessárias.
 */
export function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  if (globalForRedis.redis && globalForRedis.redisUrl === url) {
    return globalForRedis.redis;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1500,
    enableOfflineQueue: true,
    retryStrategy(times) {
      if (times > 2) return null;
      return Math.min(times * 100, 300);
    },
  });

  client.on("error", (err) => {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[redis] Falha na conexão:", err.message);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = client;
    globalForRedis.redisUrl = url;
  }

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (!globalForRedis.redis) return;
  try {
    await globalForRedis.redis.quit();
  } catch {
    globalForRedis.redis.disconnect();
  } finally {
    globalForRedis.redis = undefined;
    globalForRedis.redisUrl = undefined;
  }
}
