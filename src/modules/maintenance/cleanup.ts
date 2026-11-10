import { prisma } from "@/lib/db";

export interface MaintenanceReport {
  timestamp: string;
  expiredRateLimitsDeleted: number;
  expiredVerificationTokensDeleted: number;
  expiredResetTokensDeleted: number;
  expiredSessionsDeleted: number;
  staleInvitesDeleted: number;
  oldReadNotificationsDeleted: number;
  oldAuditLogsDeleted: number;
  durationMs: number;
}

export interface MaintenanceOptions {
  auditLogRetentionDays?: number;
  readNotificationRetentionDays?: number;
  staleInviteRetentionDays?: number;
}

/**
 * Rotina de Housekeeping e Limpeza Periódica do PostgreSQL (Neon).
 * - Remove registros obsoletos de janelas de rate-limit, tokens expirados e notificações antigas.
 * - Evita o crescimento indefinido das tabelas, mantendo o tamanho em disco otimizado.
 * - Permite ao Neon suspender computação ociosa (scale-to-zero) sem sofrer com tabelas inchadas.
 */
export async function runDatabaseMaintenance(
  options: MaintenanceOptions = {}
): Promise<MaintenanceReport> {
  const startTime = Date.now();
  const now = new Date();

  const auditRetentionDays = options.auditLogRetentionDays ?? 90;
  const readNotificationRetentionDays = options.readNotificationRetentionDays ?? 60;
  const staleInviteRetentionDays = options.staleInviteRetentionDays ?? 30;

  const rateLimitCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 horas
  const tokenCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 horas
  const inviteCutoff = new Date(now.getTime() - staleInviteRetentionDays * 24 * 60 * 60 * 1000);
  const notificationCutoff = new Date(
    now.getTime() - readNotificationRetentionDays * 24 * 60 * 60 * 1000
  );
  const auditLogCutoff = new Date(
    now.getTime() - auditRetentionDays * 24 * 60 * 60 * 1000
  );

  // Executa exclusões em paralelo ou em lote com transações seguras
  const [
    rateLimitsResult,
    verificationTokensResult,
    resetTokensResult,
    sessionsResult,
    invitesResult,
    notificationsResult,
    auditLogsResult,
  ] = await Promise.all([
    // 1. Limpa janelas antigas de rate limit
    prisma.rateLimit.deleteMany({
      where: { windowStart: { lt: rateLimitCutoff } },
    }),

    // 2. Limpa tokens de verificação expirados
    prisma.verificationToken.deleteMany({
      where: { expires: { lt: tokenCutoff } },
    }),

    // 3. Limpa tokens de reset de senha expirados ou já utilizados há mais de 7 dias
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: tokenCutoff } },
          {
            usedAt: { not: null },
            createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
    }),

    // 4. Limpa sessões expiradas do Auth.js
    prisma.session.deleteMany({
      where: { expires: { lt: now } },
    }),

    // 5. Limpa convites pendentes que expiraram há mais de 30 dias
    prisma.studentInvite.deleteMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: inviteCutoff },
      },
    }),

    // 6. Limpa notificações já lidas há mais de 60 dias
    prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: { lt: notificationCutoff },
      },
    }),

    // 7. Limpa logs de auditoria acima do período de retenção
    prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: auditLogCutoff },
      },
    }),
  ]);

  const durationMs = Date.now() - startTime;

  return {
    timestamp: now.toISOString(),
    expiredRateLimitsDeleted: rateLimitsResult.count,
    expiredVerificationTokensDeleted: verificationTokensResult.count,
    expiredResetTokensDeleted: resetTokensResult.count,
    expiredSessionsDeleted: sessionsResult.count,
    staleInvitesDeleted: invitesResult.count,
    oldReadNotificationsDeleted: notificationsResult.count,
    oldAuditLogsDeleted: auditLogsResult.count,
    durationMs,
  };
}
