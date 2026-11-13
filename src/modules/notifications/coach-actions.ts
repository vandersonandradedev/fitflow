"use server";

import { prisma } from "@/lib/db";
import { requireCoachContext } from "@/server/auth/session";
import { toActionState, type ActionState } from "@/server/actions";
import { createNotification } from "./service";
import { AIEngagementAgent } from "@/modules/ai/engagement-agent";

export interface SendCoachNudgeInput {
  title: string;
  message: string;
  type?: "WORKOUT_ASSIGNED" | "SYSTEM" | "WORKOUT_COMPLETED";
}

/**
 * Permite ao treinador enviar um push notification instantâneo diretamente
 * para o celular/dispositivo de um aluno específico.
 */
export async function sendCoachNudgeAction(
  studentProfileId: string,
  input: SendCoachNudgeInput
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await requireCoachContext();

    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentProfileId,
        tenantId: ctx.tenantId,
        deletedAt: null,
      },
      select: {
        userId: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!student) {
      throw new Error("Aluno não encontrado ou sem permissão.");
    }

    const title = input.title.trim();
    const message = input.message.trim();

    if (!title || !message) {
      throw new Error("Título e mensagem são obrigatórios.");
    }

    await createNotification(ctx.tenantId, {
      userId: student.userId,
      title,
      message,
      type: input.type || "SYSTEM",
      link: "/student/today",
    });

    return {
      ok: true,
      message: `Notificação enviada com sucesso para ${student.user.name || "o aluno"}!`,
    };
  });
}

/**
 * Gera uma sugestão de mensagem inteligente com IA para o treinador enviar ao aluno.
 */
export async function generateAINudgeSuggestionAction(
  studentProfileId: string,
  category: "WORKOUT" | "WATER" | "MOTIVATION" | "CHURN"
): Promise<{ ok: boolean; title?: string; message?: string; error?: string }> {
  try {
    const ctx = await requireCoachContext();

    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentProfileId,
        tenantId: ctx.tenantId,
        deletedAt: null,
      },
      include: {
        user: { select: { name: true } },
        workoutSessions: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!student) {
      return { ok: false, error: "Aluno não encontrado." };
    }

    const studentName = student.user.name || "Aluno";
    const lastSession = student.workoutSessions[0];
    const daysInactive = lastSession?.completedAt
      ? Math.floor((Date.now() - lastSession.completedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 3;

    let res;
    if (category === "WORKOUT") {
      res = await AIEngagementAgent.getMorningWorkoutReminder({
        studentName,
        fitnessGoal: student.fitnessGoal,
      });
    } else if (category === "WATER") {
      res = await AIEngagementAgent.getWaterReminder({
        studentName,
        fitnessGoal: student.fitnessGoal,
      });
    } else if (category === "CHURN") {
      res = await AIEngagementAgent.getChurnReminder({
        studentName,
        fitnessGoal: student.fitnessGoal,
        daysInactive,
      });
    } else {
      res = await AIEngagementAgent.getEveningPendingWorkoutReminder({
        studentName,
        fitnessGoal: student.fitnessGoal,
      });
    }

    return {
      ok: true,
      title: res.title,
      message: res.message,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao gerar sugestão com IA.",
    };
  }
}
