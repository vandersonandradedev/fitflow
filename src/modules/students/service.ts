import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/server/audit";
import { assertCoach, type TenantContext } from "@/server/auth/context";
import { NotFoundError, ValidationError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import { createDirectStudentSchema, listStudentsSchema, updateStudentSchema } from "./types";

/**
 * Seleção explícita: nunca devolvemos o User inteiro (evita vazar passwordHash, sessionVersion etc.).
 * Dados de saúde só saem na ficha individual, não na listagem.
 */
const studentListSelect = {
  id: true,
  status: true,
  phone: true,
  fitnessGoal: true,
  experienceLevel: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, image: true } },
} satisfies Prisma.StudentProfileSelect;

const studentDetailSelect = {
  ...studentListSelect,
  birthDate: true,
  trainerNotes: true,
  healthConditions: true,
  updatedAt: true,
} satisfies Prisma.StudentProfileSelect;

export async function listStudentsForTenant(ctx: TenantContext, input: unknown = {}) {
  assertCoach(ctx);
  const { status, search, take } = parseInput(listStudentsSchema, input);

  return prisma.studentProfile.findMany({
    where: {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    select: studentListSelect,
    orderBy: { user: { name: "asc" } },
    take,
  });
}

/**
 * Retorna NotFound tanto para "não existe" quanto para "pertence a outro tenant",
 * impedindo que um treinador descubra quais IDs existem em outros tenants.
 */
export async function getStudentForTenant(ctx: TenantContext, studentId: string) {
  assertCoach(ctx);
  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, tenantId: ctx.tenantId, deletedAt: null },
    select: studentDetailSelect,
  });
  if (!student) throw new NotFoundError("Aluno não encontrado.");
  return student;
}

export async function updateStudentForTenant(ctx: TenantContext, studentId: string, input: unknown) {
  assertCoach(ctx);
  const data = parseInput(updateStudentSchema, input);

  // A propriedade é validada na própria cláusula WHERE do UPDATE (atômico, sem janela TOCTOU).
  const result = await prisma.studentProfile.updateMany({
    where: { id: studentId, tenantId: ctx.tenantId, deletedAt: null },
    data: {
      ...data,
      phone: data.phone ?? undefined,
      trainerNotes: data.trainerNotes ?? undefined,
      healthConditions: data.healthConditions ?? undefined,
      birthDate: data.birthDate ?? undefined,
    },
  });
  if (result.count !== 1) throw new NotFoundError("Aluno não encontrado.");

  await writeAudit(prisma, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "STUDENT_UPDATED",
    resource: "student_profile",
    resourceId: studentId,
    // Apenas os NOMES dos campos alterados; nunca os valores (podem conter dados de saúde).
    metadata: { fields: Object.keys(data) },
  });

  return getStudentForTenant(ctx, studentId);
}

export async function listPendingInvitesForTenant(ctx: TenantContext) {
  assertCoach(ctx);
  return prisma.studentInvite.findMany({
    where: { tenantId: ctx.tenantId, status: "PENDING", expiresAt: { gt: new Date() } },
    select: { id: true, name: true, email: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/**
 * Remove (soft-delete / arquiva) o aluno do tenant com segurança anti-IDOR.
 * Invalida imediatamente as sessões de login do aluno para este estúdio.
 */
export async function deleteStudentForTenant(ctx: TenantContext, studentId: string) {
  assertCoach(ctx);

  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, tenantId: ctx.tenantId, deletedAt: null },
    select: { id: true, userId: true },
  });

  if (!student) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.update({
      where: { id: student.id },
      data: {
        deletedAt: new Date(),
        status: "ARCHIVED",
      },
    });

    await tx.user.update({
      where: { id: student.userId },
      data: { sessionVersion: { increment: 1 } },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "STUDENT_DELETED",
      resource: "student_profile",
      resourceId: student.id,
    });
  });

  return { ok: true };
}

/**
 * Cria ou reativa um aluno diretamente pelo treinador no estúdio.
 */
export async function createStudentDirectlyForTenant(ctx: TenantContext, rawInput: unknown) {
  assertCoach(ctx);
  const data = parseInput(createDirectStudentSchema, rawInput);

  return prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          emailVerified: new Date(),
        },
      });
    }

    const existingProfile = await tx.studentProfile.findFirst({
      where: { tenantId: ctx.tenantId, userId: user.id },
    });

    if (existingProfile) {
      if (existingProfile.deletedAt) {
        const reactivated = await tx.studentProfile.update({
          where: { id: existingProfile.id },
          data: {
            deletedAt: null,
            status: "ACTIVE",
            fitnessGoal: data.fitnessGoal,
            experienceLevel: data.experienceLevel,
            phone: data.phone,
            trainerNotes: data.trainerNotes,
            healthConditions: data.healthConditions,
          },
          select: studentDetailSelect,
        });
        return reactivated;
      }
      throw new ValidationError("Este aluno já está cadastrado no seu estúdio.");
    }

    await tx.tenantMember.upsert({
      where: { userId: user.id },
      create: {
        tenantId: ctx.tenantId,
        userId: user.id,
        role: "STUDENT",
      },
      update: {},
    });

    const newProfile = await tx.studentProfile.create({
      data: {
        tenantId: ctx.tenantId,
        userId: user.id,
        status: "ACTIVE",
        fitnessGoal: data.fitnessGoal,
        experienceLevel: data.experienceLevel,
        phone: data.phone,
        trainerNotes: data.trainerNotes,
        healthConditions: data.healthConditions,
      },
      select: studentDetailSelect,
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "STUDENT_CREATED_DIRECTLY",
      resource: "student_profile",
      resourceId: newProfile.id,
      metadata: { email: data.email, name: data.name },
    });

    return newProfile;
  });
}
