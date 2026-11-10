import { prisma } from "@/lib/db";
import { ForbiddenError, UnauthorizedError } from "@/server/errors";

export type TenantRole = "OWNER" | "COACH" | "STUDENT";

declare const tenantContextBrand: unique symbol;

/**
 * Contexto autenticado e validado no servidor. É o ÚNICO parâmetro de identidade aceito pelos serviços
 * de dados. O tipo é "branded": não é possível fabricar um TenantContext com um objeto literal,
 * apenas através de `resolveTenantContext`, que consulta o banco.
 */
export interface TenantContext {
  readonly [tenantContextBrand]: true;
  readonly userId: string;
  readonly tenantId: string;
  readonly role: TenantRole;
  /** Presente somente quando role === "STUDENT". */
  readonly studentProfileId: string | null;
}

/**
 * Resolve o contexto a partir de userId + sessionVersion extraídos da sessão assinada.
 * Nada vindo do cliente (body, query, headers) participa daqui.
 *
 * Falha se: usuário inexistente, sessão revogada (sessionVersion divergente),
 * sem vínculo com tenant, ou tenant não ACTIVE.
 */
export async function resolveTenantContext(userId: string, sessionVersion: number): Promise<TenantContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sessionVersion: true,
      memberships: {
        select: {
          tenantId: true,
          role: true,
          tenant: { select: { status: true } },
        },
        take: 1,
      },
      studentProfiles: { select: { id: true, tenantId: true, deletedAt: true, status: true } },
    },
  });

  if (!user || user.sessionVersion !== sessionVersion) {
    throw new UnauthorizedError();
  }

  const membership = user.memberships[0];
  if (!membership) throw new ForbiddenError("Usuário sem vínculo com um treinador.");
  if (membership.tenant.status !== "ACTIVE") throw new ForbiddenError("Conta do treinador indisponível.");

  let studentProfileId: string | null = null;
  if (membership.role === "STUDENT") {
    const profile = user.studentProfiles.find((p) => p.tenantId === membership.tenantId && p.deletedAt === null);
    if (!profile || profile.status === "ARCHIVED") throw new ForbiddenError("Perfil de aluno indisponível.");
    studentProfileId = profile.id;
  }

  return Object.freeze({
    userId,
    tenantId: membership.tenantId,
    role: membership.role,
    studentProfileId,
  }) as unknown as TenantContext;
}

export function isCoach(ctx: TenantContext): boolean {
  return ctx.role === "OWNER" || ctx.role === "COACH";
}

/** Garante que o contexto pertence a um treinador (OWNER/COACH). Alunos nunca passam. */
export function assertCoach(ctx: TenantContext): void {
  if (!isCoach(ctx)) throw new ForbiddenError();
}

export function assertStudent(ctx: TenantContext): asserts ctx is TenantContext & { studentProfileId: string } {
  if (ctx.role !== "STUDENT" || !ctx.studentProfileId) throw new ForbiddenError();
}
