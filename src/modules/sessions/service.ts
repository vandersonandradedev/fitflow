import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertStudent, isCoach, type TenantContext } from "@/server/auth/context";
import { writeAudit } from "@/server/audit";
import { ConflictError, NotFoundError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import {
  finishSessionSchema,
  sessionHistoryFilterSchema,
  startSessionSchema,
} from "./types";

const sessionFullInclude = {
  trainingDay: {
    select: {
      id: true,
      name: true,
      dayOfWeek: true,
      description: true,
    },
  },
  programVersion: {
    select: {
      id: true,
      versionNumber: true,
      program: {
        select: {
          id: true,
          title: true,
          goal: true,
        },
      },
    },
  },
  exerciseLogs: {
    orderBy: { orderIndex: "asc" as const },
    include: {
      exercise: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { orderIndex: "asc" as const } },
          instructions: { orderBy: { stepNumber: "asc" as const } },
        },
      },
      setLogs: {
        orderBy: { setNumber: "asc" as const },
      },
    },
  },
} satisfies Prisma.WorkoutSessionInclude;

/**
 * Inicia ou retoma uma sessão de treino para o aluno autenticado.
 * - Garante que o dia de treino pertença a uma versão `PUBLISHED` do aluno no tenant atual.
 * - Se já houver uma sessão `IN_PROGRESS` para este treino, retoma a sessão existente.
 * - Caso contrário, cria uma nova sessão `IN_PROGRESS` inicializando os logs dos exercícios.
 */
export async function startOrResumeWorkoutSession(
  ctx: TenantContext,
  rawInput: unknown
) {
  assertStudent(ctx);
  const { trainingDayId } = parseInput(startSessionSchema, rawInput);

  const trainingDay = await prisma.trainingDay.findFirst({
    where: {
      id: trainingDayId,
      version: {
        status: "PUBLISHED",
        program: {
          tenantId: ctx.tenantId,
          studentProfileId: ctx.studentProfileId!,
          isActive: true,
        },
      },
    },
    include: {
      version: { select: { id: true } },
      workoutExercises: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercise: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              media: { orderBy: { orderIndex: "asc" } },
              instructions: { orderBy: { stepNumber: "asc" } },
            },
          },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!trainingDay) {
    throw new NotFoundError(
      "Treino não encontrado ou não está publicado para seu perfil."
    );
  }

  // Verifica se já existe uma sessão em andamento para este dia
  const existingSession = await prisma.workoutSession.findFirst({
    where: {
      tenantId: ctx.tenantId,
      studentProfileId: ctx.studentProfileId!,
      trainingDayId: trainingDay.id,
      status: "IN_PROGRESS",
    },
    include: sessionFullInclude,
  });

  if (existingSession) {
    return existingSession;
  }

  // Cria uma nova sessão em andamento com os exercícios pré-cadastrados
  return prisma.$transaction(async (tx) => {
    const session = await tx.workoutSession.create({
      data: {
        tenantId: ctx.tenantId,
        studentProfileId: ctx.studentProfileId!,
        programVersionId: trainingDay.version.id,
        trainingDayId: trainingDay.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        exerciseLogs: {
          create: trainingDay.workoutExercises.map((wex, idx) => ({
            exerciseId: wex.exerciseId,
            workoutExerciseId: wex.id,
            orderIndex: idx,
            isCompleted: false,
            notes: wex.coachNotes,
            setLogs: {
              create: wex.sets.map((s) => ({
                setNumber: s.setNumber,
                prescribedLoadKg: s.suggestedLoadKg,
                actualLoadKg: s.suggestedLoadKg ?? 0,
                prescribedReps: s.repsTarget,
                actualReps: parseInt(s.repsTarget.split("-")[0] ?? "10", 10) || 10,
                completed: false,
                restTakenSeconds: s.restSeconds,
              })),
            },
          })),
        },
      },
      include: sessionFullInclude,
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "WORKOUT_SESSION_STARTED",
      resource: "workout_session",
      resourceId: session.id,
      metadata: { trainingDayId: trainingDay.id },
    });

    return session;
  });
}

/**
 * Busca os registros de carga/repetições da última sessão concluída para uma lista de exercícios.
 * Alimenta a dica "Carga anterior" durante a execução do treino.
 */
export async function getLastPerformanceForExercises(
  ctx: TenantContext,
  exerciseIds: string[]
) {
  if (exerciseIds.length === 0) return {};

  const studentProfileId = isCoach(ctx)
    ? undefined
    : ctx.studentProfileId!;

  const whereCondition: Prisma.SetLogWhereInput = {
    exerciseLog: {
      exerciseId: { in: exerciseIds },
      workoutSession: {
        tenantId: ctx.tenantId,
        status: "COMPLETED",
        ...(studentProfileId ? { studentProfileId } : {}),
      },
    },
    completed: true,
  };

  const logs = await prisma.setLog.findMany({
    where: whereCondition,
    orderBy: { loggedAt: "desc" },
    take: 100,
    select: {
      setNumber: true,
      actualLoadKg: true,
      actualReps: true,
      exerciseLog: {
        select: {
          exerciseId: true,
          workoutSession: { select: { completedAt: true } },
        },
      },
    },
  });

  const map: Record<
    string,
    Array<{ setNumber: number; loadKg: number; reps: number; date: Date | null }>
  > = {};

  for (const log of logs) {
    const exId = log.exerciseLog.exerciseId;
    if (!map[exId]) {
      map[exId] = [];
    }
    // Mantém os sets mais recentes por número de série
    if (!map[exId].some((s) => s.setNumber === log.setNumber)) {
      map[exId].push({
        setNumber: log.setNumber,
        loadKg: Number(log.actualLoadKg),
        reps: log.actualReps,
        date: log.exerciseLog.workoutSession.completedAt,
      });
    }
  }

  return map;
}

/**
 * Finaliza a sessão de treino:
 * - Calcula o volume total (tonelagem em kg: soma de actualLoadKg * actualReps para séries concluídas).
 * - Grava de forma atômica o status `COMPLETED`, duração total e feedback do aluno.
 * - Atualiza os registros de `exerciseLogs` e `setLogs`.
 * - Emite notificação de conclusão ao personal trainer.
 * - Registra log de auditoria.
 */
export async function finishWorkoutSession(
  ctx: TenantContext,
  rawInput: unknown
) {
  assertStudent(ctx);
  const data = parseInput(finishSessionSchema, rawInput);

  const session = await prisma.workoutSession.findFirst({
    where: {
      id: data.sessionId,
      tenantId: ctx.tenantId,
      studentProfileId: ctx.studentProfileId!,
    },
    include: {
      trainingDay: { select: { name: true } },
      studentProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!session) {
    throw new NotFoundError("Sessão de treino não encontrada.");
  }

  if (session.status === "COMPLETED") {
    throw new ConflictError("Esta sessão de treino já foi concluída.");
  }

  // Cálculo de volume total acumulado (tonelagem)
  let totalVolumeKg = 0;
  for (const ex of data.exercises) {
    for (const s of ex.sets) {
      if (s.completed && s.actualLoadKg > 0 && s.actualReps > 0) {
        totalVolumeKg += s.actualLoadKg * s.actualReps;
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    // Remove logs preliminares da sessão para substituir pelo estado real executado
    await tx.exerciseLog.deleteMany({
      where: { workoutSessionId: session.id },
    });

    const updatedSession = await tx.workoutSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        totalDurationSeconds: data.totalDurationSeconds,
        totalVolumeKg: new Prisma.Decimal(totalVolumeKg),
        perceivedExertionRpe: data.perceivedExertionRpe ?? null,
        studentFeedback: data.studentFeedback ?? null,
        exerciseLogs: {
          create: data.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            workoutExerciseId: ex.workoutExerciseId,
            orderIndex: ex.orderIndex,
            isCompleted: ex.isCompleted,
            notes: ex.notes,
            setLogs: {
              create: ex.sets.map((s) => ({
                setNumber: s.setNumber,
                prescribedLoadKg: s.prescribedLoadKg
                  ? new Prisma.Decimal(s.prescribedLoadKg)
                  : null,
                actualLoadKg: new Prisma.Decimal(s.actualLoadKg),
                prescribedReps: s.prescribedReps ?? null,
                actualReps: s.actualReps,
                completed: s.completed,
                restTakenSeconds: s.restTakenSeconds ?? null,
                rpe: s.rpe ? new Prisma.Decimal(s.rpe) : null,
              })),
            },
          })),
        },
      },
      include: sessionFullInclude,
    });

    // Notifica o personal trainer do tenant sobre a conclusão do treino
    const coachMember = await tx.tenantMember.findFirst({
      where: {
        tenantId: ctx.tenantId,
        role: "OWNER",
      },
      select: { userId: true },
    });

    if (coachMember) {
      const studentName =
        session.studentProfile.user.name ?? session.studentProfile.user.email;
      const durationMin = Math.max(
        1,
        Math.round(data.totalDurationSeconds / 60)
      );

      await tx.notification.create({
        data: {
          tenantId: ctx.tenantId,
          userId: coachMember.userId,
          type: "WORKOUT_COMPLETED",
          title: "Treino Concluído!",
          message: `${studentName} concluiu "${session.trainingDay.name}" (${totalVolumeKg.toLocaleString("pt-BR")} kg em ${durationMin} min).`,
          link: `/coach/students/${session.studentProfileId}`,
        },
      });
    }

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "WORKOUT_SESSION_COMPLETED",
      resource: "workout_session",
      resourceId: session.id,
      metadata: {
        totalVolumeKg,
        durationSeconds: data.totalDurationSeconds,
      },
    });

    return updatedSession;
  });
}

/**
 * Descarta ou cancela uma sessão em andamento.
 */
export async function abandonWorkoutSession(
  ctx: TenantContext,
  sessionId: string
) {
  assertStudent(ctx);

  const session = await prisma.workoutSession.findFirst({
    where: {
      id: sessionId,
      tenantId: ctx.tenantId,
      studentProfileId: ctx.studentProfileId!,
    },
    select: { id: true, status: true },
  });

  if (!session) {
    throw new NotFoundError("Sessão de treino não encontrada.");
  }

  if (session.status === "COMPLETED") {
    throw new ConflictError("Sessões concluídas não podem ser descartadas.");
  }

  return prisma.workoutSession.update({
    where: { id: session.id },
    data: { status: "ABANDONED" },
  });
}

/**
 * Lista o histórico de sessões concluídas do aluno no tenant atual.
 * - Personal trainers podem consultar o histórico de qualquer aluno do seu tenant.
 * - Alunos consultam estritamente o próprio histórico (anti-IDOR).
 */
export async function listStudentSessionHistory(
  ctx: TenantContext,
  rawFilter: unknown = {}
) {
  const filter = parseInput(sessionHistoryFilterSchema, rawFilter);

  const studentProfileId = isCoach(ctx)
    ? filter.studentProfileId
    : ctx.studentProfileId!;

  if (!studentProfileId && !isCoach(ctx)) {
    throw new NotFoundError("Perfil de aluno não encontrado.");
  }

  const where: Prisma.WorkoutSessionWhereInput = {
    tenantId: ctx.tenantId,
    status: "COMPLETED",
    ...(studentProfileId ? { studentProfileId } : {}),
  };

  return prisma.workoutSession.findMany({
    where,
    take: filter.limit,
    orderBy: { completedAt: "desc" },
    include: {
      trainingDay: {
        select: { id: true, name: true, dayOfWeek: true },
      },
      studentProfile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      exerciseLogs: {
        select: {
          id: true,
          exercise: { select: { name: true, primaryMuscleGroup: true } },
          setLogs: {
            select: {
              id: true,
              setNumber: true,
              actualLoadKg: true,
              actualReps: true,
              completed: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Obtém os detalhes completos de uma sessão de treino específica.
 * Anti-IDOR: alunos só podem visualizar sessões que pertencem a si mesmos.
 */
export async function getSessionDetails(ctx: TenantContext, sessionId: string) {
  const where: Prisma.WorkoutSessionWhereInput = {
    id: sessionId,
    tenantId: ctx.tenantId,
  };

  if (!isCoach(ctx)) {
    where.studentProfileId = ctx.studentProfileId!;
  }

  const session = await prisma.workoutSession.findFirst({
    where,
    include: sessionFullInclude,
  });

  if (!session) {
    throw new NotFoundError("Sessão de treino não encontrada.");
  }

  return session;
}
