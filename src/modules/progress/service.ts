import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertCoach, isCoach, type TenantContext } from "@/server/auth/context";
import { writeAudit } from "@/server/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import { physicalAssessmentInputSchema } from "./types";

/**
 * Resolve e valida o ID do aluno garantindo isolamento multi-tenant (anti-IDOR).
 */
async function resolveAndValidateStudent(ctx: TenantContext, studentProfileId?: string) {
  if (!isCoach(ctx) && studentProfileId && studentProfileId !== ctx.studentProfileId) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  const targetId = isCoach(ctx) ? studentProfileId : ctx.studentProfileId!;

  if (!targetId) {
    throw new ValidationError("Selecione um aluno para consultar o progresso.");
  }

  const student = await prisma.studentProfile.findFirst({
    where: {
      id: targetId,
      tenantId: ctx.tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      userId: true,
      fitnessGoal: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!student) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  return student;
}

/**
 * Registra uma nova avaliação física com medidas corporais de circunferência e composição.
 */
export async function recordPhysicalAssessment(ctx: TenantContext, rawInput: unknown) {
  const data = parseInput(physicalAssessmentInputSchema, rawInput);
  const student = await resolveAndValidateStudent(ctx, data.studentProfileId);

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.physicalAssessment.create({
      data: {
        tenantId: ctx.tenantId,
        studentProfileId: student.id,
        evaluatorUserId: ctx.userId,
        assessmentDate: data.assessmentDate ?? new Date(),
        weightKg: new Prisma.Decimal(data.weightKg),
        heightCm: data.heightCm ? new Prisma.Decimal(data.heightCm) : null,
        bodyFatPercentage: data.bodyFatPercentage
          ? new Prisma.Decimal(data.bodyFatPercentage)
          : null,
        muscleMassPercentage: data.muscleMassPercentage
          ? new Prisma.Decimal(data.muscleMassPercentage)
          : null,
        notes: data.notes,
        measurements: {
          create: {
            chestCm: data.chestCm ? new Prisma.Decimal(data.chestCm) : null,
            waistCm: data.waistCm ? new Prisma.Decimal(data.waistCm) : null,
            abdomenCm: data.abdomenCm ? new Prisma.Decimal(data.abdomenCm) : null,
            hipsCm: data.hipsCm ? new Prisma.Decimal(data.hipsCm) : null,
            rightArmCm: data.rightArmCm ? new Prisma.Decimal(data.rightArmCm) : null,
            leftArmCm: data.leftArmCm ? new Prisma.Decimal(data.leftArmCm) : null,
            rightThighCm: data.rightThighCm ? new Prisma.Decimal(data.rightThighCm) : null,
            leftThighCm: data.leftThighCm ? new Prisma.Decimal(data.leftThighCm) : null,
            rightCalfCm: data.rightCalfCm ? new Prisma.Decimal(data.rightCalfCm) : null,
            leftCalfCm: data.leftCalfCm ? new Prisma.Decimal(data.leftCalfCm) : null,
          },
        },
      },
      include: {
        measurements: true,
      },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "PHYSICAL_ASSESSMENT_RECORDED",
      resource: "physical_assessment",
      resourceId: assessment.id,
      metadata: {
        studentProfileId: student.id,
        weightKg: data.weightKg,
      },
    });

    return assessment;
  });
}

/**
 * Lista as avaliações físicas do aluno com histórico de composição corporal e circunferências.
 */
export async function listPhysicalAssessments(ctx: TenantContext, studentProfileId?: string) {
  const student = await resolveAndValidateStudent(ctx, studentProfileId);

  return prisma.physicalAssessment.findMany({
    where: {
      tenantId: ctx.tenantId,
      studentProfileId: student.id,
    },
    orderBy: { assessmentDate: "desc" },
    include: {
      measurements: true,
      evaluator: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Exclui uma avaliação física (exclusivo para treinadores do tenant).
 */
export async function deletePhysicalAssessment(ctx: TenantContext, assessmentId: string) {
  assertCoach(ctx);

  const assessment = await prisma.physicalAssessment.findFirst({
    where: {
      id: assessmentId,
      tenantId: ctx.tenantId,
    },
    select: { id: true, studentProfileId: true },
  });

  if (!assessment) {
    throw new NotFoundError("Avaliação física não encontrada.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.physicalAssessment.delete({
      where: { id: assessment.id },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "PHYSICAL_ASSESSMENT_DELETED",
      resource: "physical_assessment",
      resourceId: assessment.id,
    });
  });
}

/**
 * Calcula a adesão e frequência semanal de treinos nos últimos N semanas.
 * Compara as sessões concluídas com a meta de dias prescritos no programa ativo.
 */
export async function getWeeklyAdherenceStats(
  ctx: TenantContext,
  studentProfileId?: string,
  weeksCount = 8
) {
  const student = await resolveAndValidateStudent(ctx, studentProfileId);

  // Busca a frequência prescrita na versão publicada do programa ativo
  const activeProgram = await prisma.trainingProgram.findFirst({
    where: {
      tenantId: ctx.tenantId,
      studentProfileId: student.id,
      isActive: true,
    },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        take: 1,
        include: { trainingDays: { select: { id: true } } },
      },
    },
  });

  const publishedDaysCount =
    activeProgram?.versions[0]?.trainingDays.length ?? 3;
  const targetSessionsPerWeek = Math.max(1, publishedDaysCount);

  // Calcula os limites de semanas
  const now = new Date();
  const weeks: Array<{
    weekLabel: string;
    startDate: Date;
    endDate: Date;
    completedSessions: number;
    targetSessions: number;
    adherencePercentage: number;
  }> = [];

  for (let i = weeksCount - 1; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekLabel = `${start.getDate().toString().padStart(2, "0")}/${(
      start.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;

    weeks.push({
      weekLabel,
      startDate: start,
      endDate: end,
      completedSessions: 0,
      targetSessions: targetSessionsPerWeek,
      adherencePercentage: 0,
    });
  }

  const oldestDate = weeks[0]!.startDate;

  const completedSessions = await prisma.workoutSession.findMany({
    where: {
      tenantId: ctx.tenantId,
      studentProfileId: student.id,
      status: "COMPLETED",
      completedAt: { gte: oldestDate },
    },
    select: { completedAt: true },
  });

  for (const session of completedSessions) {
    if (!session.completedAt) continue;
    const sessionTime = session.completedAt.getTime();
    for (const week of weeks) {
      if (
        sessionTime >= week.startDate.getTime() &&
        sessionTime < week.endDate.getTime()
      ) {
        week.completedSessions += 1;
        break;
      }
    }
  }

  for (const week of weeks) {
    week.adherencePercentage = Math.min(
      100,
      Math.round((week.completedSessions / week.targetSessions) * 100)
    );
  }

  return weeks.map((w) => ({
    weekLabel: w.weekLabel,
    completedSessions: w.completedSessions,
    targetSessions: w.targetSessions,
    adherencePercentage: w.adherencePercentage,
  }));
}

/**
 * Calcula a progressão de carga e 1RM estimada para um exercício específico ao longo do tempo.
 * Utiliza a fórmula padrão de Epley: 1RM = Carga * (1 + Reps / 30).
 */
export async function getExerciseProgressionStats(
  ctx: TenantContext,
  exerciseId: string,
  studentProfileId?: string
) {
  const student = await resolveAndValidateStudent(ctx, studentProfileId);

  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      OR: [
        { isGlobal: true, tenantId: null },
        { isGlobal: false, tenantId: ctx.tenantId },
      ],
    },
    select: { id: true, name: true, primaryMuscleGroup: true },
  });

  if (!exercise) {
    throw new NotFoundError("Exercício não encontrado.");
  }

  const setLogs = await prisma.setLog.findMany({
    where: {
      completed: true,
      actualLoadKg: { gt: 0 },
      actualReps: { gt: 0 },
      exerciseLog: {
        exerciseId: exercise.id,
        workoutSession: {
          tenantId: ctx.tenantId,
          studentProfileId: student.id,
          status: "COMPLETED",
        },
      },
    },
    include: {
      exerciseLog: {
        select: {
          workoutSession: { select: { id: true, completedAt: true } },
        },
      },
    },
    orderBy: { loggedAt: "asc" },
  });

  // Agrupa os sets por sessão de treino (data de conclusão)
  const sessionMap = new Map<
    string,
    {
      date: string;
      maxLoadKg: number;
      estimated1RmKg: number;
      volumeKg: number;
      bestSet: string;
    }
  >();

  for (const set of setLogs) {
    const sessionDate = set.exerciseLog.workoutSession.completedAt ?? set.loggedAt;
    const dateKey = sessionDate.toISOString().slice(0, 10);
    const dateFormatted = new Date(dateKey).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    const load = Number(set.actualLoadKg);
    const reps = set.actualReps;
    // Epley formula: 1RM = weight * (1 + reps / 30) para reps <= 12
    const est1Rm =
      reps === 1
        ? load
        : Math.round(load * (1 + Math.min(reps, 15) / 30) * 10) / 10;
    const volume = load * reps;

    const existing = sessionMap.get(dateKey);
    if (!existing) {
      sessionMap.set(dateKey, {
        date: dateFormatted,
        maxLoadKg: load,
        estimated1RmKg: est1Rm,
        volumeKg: volume,
        bestSet: `${load} kg x ${reps}`,
      });
    } else {
      existing.volumeKg += volume;
      if (load > existing.maxLoadKg) {
        existing.maxLoadKg = load;
        existing.bestSet = `${load} kg x ${reps}`;
      }
      if (est1Rm > existing.estimated1RmKg) {
        existing.estimated1RmKg = est1Rm;
      }
    }
  }

  return {
    exercise,
    points: Array.from(sessionMap.values()),
  };
}

/**
 * Calcula a distribuição do volume semanal acumulado (kg levantados) por categoria muscular.
 */
export async function getMuscleGroupVolumeStats(
  ctx: TenantContext,
  studentProfileId?: string,
  weeksCount = 4
) {
  const student = await resolveAndValidateStudent(ctx, studentProfileId);
  const cutoffDate = new Date(Date.now() - weeksCount * 7 * 24 * 60 * 60 * 1000);

  const sets = await prisma.setLog.findMany({
    where: {
      completed: true,
      actualLoadKg: { gt: 0 },
      actualReps: { gt: 0 },
      exerciseLog: {
        workoutSession: {
          tenantId: ctx.tenantId,
          studentProfileId: student.id,
          status: "COMPLETED",
          completedAt: { gte: cutoffDate },
        },
      },
    },
    include: {
      exerciseLog: {
        select: {
          exercise: {
            select: {
              primaryMuscleGroup: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const groupMap = new Map<string, { totalVolumeKg: number; setsCount: number }>();

  for (const s of sets) {
    const category = s.exerciseLog.exercise.category.name;
    const volume = Number(s.actualLoadKg) * s.actualReps;

    const current = groupMap.get(category) ?? { totalVolumeKg: 0, setsCount: 0 };
    current.totalVolumeKg += volume;
    current.setsCount += 1;
    groupMap.set(category, current);
  }

  return Array.from(groupMap.entries())
    .map(([groupName, val]) => ({
      groupName,
      totalVolumeKg: Math.round(val.totalVolumeKg),
      setsCount: val.setsCount,
    }))
    .sort((a, b) => b.totalVolumeKg - a.totalVolumeKg);
}

/**
 * Retorna os pontos cronológicos de peso e gordura corporal para visualização gráfica.
 */
export async function getBodyCompositionProgression(
  ctx: TenantContext,
  studentProfileId?: string
) {
  const student = await resolveAndValidateStudent(ctx, studentProfileId);

  const assessments = await prisma.physicalAssessment.findMany({
    where: {
      tenantId: ctx.tenantId,
      studentProfileId: student.id,
    },
    orderBy: { assessmentDate: "asc" },
    select: {
      assessmentDate: true,
      weightKg: true,
      bodyFatPercentage: true,
      muscleMassPercentage: true,
    },
  });

  return assessments.map((a) => ({
    date: new Date(a.assessmentDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    weightKg: Number(a.weightKg),
    bodyFatPercentage: a.bodyFatPercentage ? Number(a.bodyFatPercentage) : null,
    muscleMassPercentage: a.muscleMassPercentage
      ? Number(a.muscleMassPercentage)
      : null,
  }));
}
