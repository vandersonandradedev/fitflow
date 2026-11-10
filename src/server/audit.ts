import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export interface AuditEntry {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Registra operações sensíveis. Nunca inclua senhas, tokens ou dados de saúde em `metadata`.
 * Aceita um cliente transacional para que o log seja atômico com a operação auditada.
 */
export async function writeAudit(db: Db, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      tenantId: entry.tenantId ?? null,
      userId: entry.userId ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      ipAddress: entry.ipAddress ?? null,
      metadata: entry.metadata,
    },
  });
}
