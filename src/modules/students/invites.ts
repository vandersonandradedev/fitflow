import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { acceptInviteSchema, CURRENT_TERMS_VERSION, tokenOnlySchema } from "@/modules/auth/types";
import { writeAudit } from "@/server/audit";
import { assertCoach, type TenantContext } from "@/server/auth/context";
import { appUrl, sendEmail } from "@/server/email";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";
import { hashPassword } from "@/server/security/password";
import { RATE_LIMITS, enforceRateLimit } from "@/server/security/rate-limit";
import { TOKEN_TTL_MS, generateToken, hashToken } from "@/server/security/tokens";
import { parseInput } from "@/server/validation";
import { createStudentInviteSchema } from "./types";

/**
 * Cria (ou reemite) um convite. O treinador NUNCA descobre se o e-mail já pertence a outra conta
 * ou a outro tenant: nesses casos a resposta é idêntica à de sucesso e nada é enviado.
 * Assim a existência de usuários de outros tenants não vaza.
 */
export async function inviteStudent(ctx: TenantContext, input: unknown): Promise<void> {
  assertCoach(ctx);
  const data = parseInput(createStudentInviteSchema, input);
  await enforceRateLimit(RATE_LIMITS.inviteCreate, ctx.userId);

  const taken = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (taken) return;

  const { token, tokenHash } = generateToken();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: ctx.tenantId }, select: { name: true } });

  await prisma.$transaction(async (tx) => {
    // Só o convite mais recente para o mesmo e-mail neste tenant permanece válido.
    await tx.studentInvite.updateMany({
      where: { tenantId: ctx.tenantId, email: data.email, status: "PENDING" },
      data: { status: "REVOKED" },
    });
    const invite = await tx.studentInvite.create({
      data: {
        tenantId: ctx.tenantId,
        invitedByUserId: ctx.userId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        fitnessGoal: data.fitnessGoal,
        experienceLevel: data.experienceLevel,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS.invite),
      },
    });
    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "INVITE_SENT",
      resource: "student_invite",
      resourceId: invite.id,
    });
  });

  await sendEmail({
    to: data.email,
    subject: `${tenant.name} convidou você para o FitFlow`,
    text: `Olá, ${data.name}!\n${tenant.name} convidou você para acompanhar seus treinos no FitFlow.\nCrie sua senha em até 48 horas:\n${appUrl(`/invite/${token}`)}`,
  });
}

export async function revokeInviteForTenant(ctx: TenantContext, inviteId: string): Promise<void> {
  assertCoach(ctx);
  const result = await prisma.studentInvite.updateMany({
    where: { id: inviteId, tenantId: ctx.tenantId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (result.count !== 1) throw new NotFoundError("Convite não encontrado.");
  await writeAudit(prisma, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "INVITE_REVOKED",
    resource: "student_invite",
    resourceId: inviteId,
  });
}

/** Dados mínimos para a tela de aceite. Retorna null para qualquer token inutilizável. */
export async function getInvitePreview(input: unknown) {
  const parsed = tokenOnlySchema.safeParse(input);
  if (!parsed.success) return null;
  const invite = await prisma.studentInvite.findFirst({
    where: { tokenHash: hashToken(parsed.data.token), status: "PENDING", expiresAt: { gt: new Date() } },
    select: { name: true, tenant: { select: { name: true } } },
  });
  return invite ? { studentName: invite.name, tenantName: invite.tenant.name } : null;
}

/**
 * Aceita o convite: o token é consumido atomicamente (PENDING -> ACCEPTED) dentro da mesma transação
 * que cria usuário, vínculo e perfil. Qualquer falha reverte tudo, inclusive o consumo do token.
 * O tenant vem do convite (validado pelo hash do token), nunca de dados enviados pelo cliente.
 */
export async function acceptInvite(input: unknown, meta: { ip: string }): Promise<void> {
  const { token, password } = parseInput(acceptInviteSchema, input);
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.studentInvite.updateMany({
        where: { tokenHash, status: "PENDING", expiresAt: { gt: new Date() } },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      if (claimed.count !== 1) throw new ValidationError("Convite inválido, expirado ou já utilizado.");

      const invite = await tx.studentInvite.findUniqueOrThrow({ where: { tokenHash } });

      const user = await tx.user.create({
        data: {
          name: invite.name,
          email: invite.email,
          passwordHash,
          // O convite foi entregue neste e-mail: aceitar prova a posse da caixa de entrada.
          emailVerified: new Date(),
          termsVersion: CURRENT_TERMS_VERSION,
          termsAcceptedAt: new Date(),
        },
      });
      await tx.tenantMember.create({ data: { tenantId: invite.tenantId, userId: user.id, role: "STUDENT" } });
      const profile = await tx.studentProfile.create({
        data: {
          tenantId: invite.tenantId,
          userId: user.id,
          phone: invite.phone,
          fitnessGoal: invite.fitnessGoal,
          experienceLevel: invite.experienceLevel,
        },
      });
      await writeAudit(tx, {
        tenantId: invite.tenantId,
        userId: user.id,
        action: "INVITE_ACCEPTED",
        resource: "student_profile",
        resourceId: profile.id,
        ipAddress: meta.ip,
      });
    });
  } catch (error) {
    // E-mail já virou usuário entre o convite e o aceite (MVP: um aluno pertence a um único treinador).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("Não foi possível concluir o cadastro com este convite.");
    }
    throw error;
  }
}
