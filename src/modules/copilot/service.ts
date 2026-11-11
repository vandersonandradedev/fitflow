import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { type TenantContext } from "@/server/auth/context";
import { CopilotAnalysis, ExerciseSuggestion, ProgressionTier } from "./types";

function roundToStep(value: number, step = 0.5): number {
  return Math.round(value / step) * step;
}

/**
 * Analisa as últimas 4 semanas de execução do aluno e gera sugestões
 * de sobrecarga progressiva com base no RPE e cargas reais.
 */
export async function analyzeProgressiveOverload(
  ctx: TenantContext,
  trainingDayId: string
): Promise<CopilotAnalysis> {
  // 1. Busca o dia de treino e seus exercícios prescritos garantindo isolamento por tenant
  const day = await prisma.trainingDay.findFirst({
    where: {
      id: trainingDayId,
      version: {
        program: { tenantId: ctx.tenantId },
      },
    },
    include: {
      version: {
        include: {
          program: {
            include: {
              studentProfile: {
                include: { user: { select: { name: true, email: true } } },
              },
            },
          },
        },
      },
      workoutExercises: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercise: { select: { id: true, name: true, primaryMuscleGroup: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!day) {
    throw new NotFoundError("Dia de treino não encontrado.");
  }

  const student = day.version.program.studentProfile;
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  // 2. Busca histórico das últimas 4 semanas do aluno
  const recentLogs = await prisma.setLog.findMany({
    where: {
      completed: true,
      exerciseLog: {
        workoutSession: {
          tenantId: ctx.tenantId,
          studentProfileId: student.id,
          status: "COMPLETED",
          completedAt: { gte: fourWeeksAgo },
        },
      },
    },
    select: {
      actualLoadKg: true,
      actualReps: true,
      rpe: true,
      exerciseLog: {
        select: {
          exerciseId: true,
          workoutSession: { select: { completedAt: true } },
        },
      },
    },
    orderBy: {
      exerciseLog: { workoutSession: { completedAt: "desc" } },
    },
  });

  // Agrupa logs por exercício
  const logsByExercise = new Map<
    string,
    Array<{ load: number; reps: number; rpe: number | null }>
  >();

  for (const log of recentLogs) {
    const exId = log.exerciseLog.exerciseId;
    const existing = logsByExercise.get(exId) || [];
    existing.push({
      load: Number(log.actualLoadKg),
      reps: log.actualReps,
      rpe: log.rpe ? Number(log.rpe) : null,
    });
    logsByExercise.set(exId, existing);
  }

  const suggestions: ExerciseSuggestion[] = [];

  for (const we of day.workoutExercises) {
    const exLogs = logsByExercise.get(we.exerciseId) || [];
    const firstSet = we.sets[0];
    const currentLoad = firstSet?.suggestedLoadKg ? Number(firstSet.suggestedLoadKg) : null;
    const currentReps = firstSet?.repsTarget || "10-12";
    const restSec = firstSet?.restSeconds ?? 60;

    if (exLogs.length === 0) {
      // Sem histórico nas últimas 4 semanas
      suggestions.push({
        exerciseId: we.exerciseId,
        exerciseName: we.exercise.name,
        currentLoadKg: currentLoad,
        suggestedLoadKg: currentLoad,
        currentReps,
        suggestedReps: currentReps,
        suggestedRestSeconds: restSec,
        progressionTier: "NEW_EXERCISE",
        averageRpe: null,
        estimated1Rm: null,
        recentSessionsCount: 0,
        rationale: "Sem histórico de execuções nas últimas 4 semanas. Cargas mantidas para teste de nivelamento.",
      });
      continue;
    }

    // Calcula métricas reais
    const loads = exLogs.map((l) => l.load);
    const rpes = exLogs.map((l) => l.rpe).filter((r): r is number => r !== null);
    const maxLoad = Math.max(...loads);
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;

    // Estimativa de 1RM Epley sobre a melhor série
    const bestSet = exLogs.reduce((best, cur) => {
      const curEpley = cur.load * (1 + cur.reps / 30);
      const bestEpley = best.load * (1 + best.reps / 30);
      return curEpley > bestEpley ? cur : best;
    }, exLogs[0]);
    const estimated1Rm = roundToStep(bestSet.load * (1 + bestSet.reps / 30), 0.5);

    let tier: ProgressionTier = "MAINTENANCE";
    let suggestedLoad = currentLoad ?? roundToStep(avgLoad, 1);
    const suggestedReps = currentReps;
    let rationale = "";

    if (avgRpe !== null && avgRpe <= 7.0) {
      // Aluno executou com folga (RIR >= 3) -> Sobrecarga progressiva positiva
      tier = "PROGRESSION";
      const increasePct = 0.05; // +5%
      const rawIncrease = Math.max(1, (currentLoad || avgLoad) * increasePct);
      suggestedLoad = roundToStep((currentLoad || avgLoad) + rawIncrease, 0.5);
      rationale = `RPE médio baixo (${avgRpe.toFixed(1)}/10) nas últimas 4 semanas. Aluno com reserva neuromuscular. Sugerido aumento de +${rawIncrease.toFixed(1)} kg (+5%).`;
    } else if (avgRpe !== null && avgRpe >= 9.0) {
      // Aluno operando muito próximo da falha concêntrica -> Deload preventivo ou consolidação
      tier = "DELOAD";
      const reduction = Math.max(1, (currentLoad || avgLoad) * 0.075);
      suggestedLoad = roundToStep((currentLoad || avgLoad) - reduction, 0.5);
      rationale = `RPE médio elevado (${avgRpe.toFixed(1)}/10) com risco de overreaching. Sugerida redução profilática de volume/carga (-7.5%) para recuperação e supercompensação.`;
    } else {
      // RPE ideal (7.5 a 8.5) -> Estímulo ótimo de hipertrofia
      tier = "MAINTENANCE";
      suggestedLoad = currentLoad ?? roundToStep(maxLoad, 0.5);
      rationale = `RPE na faixa ideal de hipertrofia e tensão mecânica (${(avgRpe ?? 8.0).toFixed(1)}/10). Carga mantida com foco em qualidade de movimento e tempo sob tensão.`;
    }

    suggestions.push({
      exerciseId: we.exerciseId,
      exerciseName: we.exercise.name,
      currentLoadKg: currentLoad,
      suggestedLoadKg: suggestedLoad,
      currentReps,
      suggestedReps,
      suggestedRestSeconds: restSec,
      progressionTier: tier,
      averageRpe: avgRpe ? Number(avgRpe.toFixed(1)) : null,
      estimated1Rm,
      recentSessionsCount: exLogs.length,
      rationale,
    });
  }

  const studentName = student.user.name || "Aluno";
  const progressionsCount = suggestions.filter((s) => s.progressionTier === "PROGRESSION").length;

  return {
    studentProfileId: student.id,
    studentName,
    trainingDayId: day.id,
    dayName: day.name,
    overallTrend:
      progressionsCount > 0
        ? `${progressionsCount} exercício(s) prontos para sobrecarga progressiva com base nas últimas 4 semanas.`
        : "Cargas equilibradas com base no esforço percebido (RPE) recente.",
    suggestions,
  };
}

/**
 * Aplica as sugestões geradas pelo Copilot nas séries prescritas do dia de treino.
 */
export async function applyCopilotSuggestions(
  ctx: TenantContext,
  trainingDayId: string,
  suggestions: Array<{ exerciseId: string; suggestedLoadKg: number | null; suggestedReps: string }>
) {
  // Verifica se o dia pertence a uma versão DRAFT do tenant
  const day = await prisma.trainingDay.findFirst({
    where: {
      id: trainingDayId,
      version: {
        status: "DRAFT",
        program: { tenantId: ctx.tenantId },
      },
    },
    include: {
      workoutExercises: {
        include: { sets: true },
      },
    },
  });

  if (!day) {
    throw new ValidationError(
      "Apenas versões em rascunho (DRAFT) podem ter sugestões de carga aplicadas."
    );
  }

  return prisma.$transaction(async (tx) => {
    let updatedCount = 0;

    for (const sugg of suggestions) {
      const we = day.workoutExercises.find((w) => w.exerciseId === sugg.exerciseId);
      if (!we) continue;

      for (const s of we.sets) {
        await tx.workoutSetPrescribed.update({
          where: { id: s.id },
          data: {
            suggestedLoadKg: sugg.suggestedLoadKg,
            repsTarget: sugg.suggestedReps,
          },
        });
        updatedCount++;
      }
    }

    return { ok: true, updatedSetsCount: updatedCount };
  });
}
