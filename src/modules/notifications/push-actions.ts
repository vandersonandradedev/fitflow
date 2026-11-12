"use server";

import { getTenantContext } from "@/server/auth/session";
import { savePushSubscription, sendPushToUser } from "@/server/notifications/push";
import type { ActionState } from "@/server/actions";

export async function savePushSubscriptionAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<ActionState> {
  try {
    const ctx = await getTenantContext();

    if (!input.endpoint || !input.p256dh || !input.auth) {
      return { error: "Dados de subscrição push inválidos." };
    }

    await savePushSubscription({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    });

    // Envia uma notificação imediata de confirmação
    await sendPushToUser(ctx.userId, {
      title: "Notificações Ativadas! 🔔",
      body: "Você receberá lembretes de treinos e avisos do seu treinador mesmo com o FitFlow fechado.",
      url: "/student/today",
    });

    return { ok: true, message: "Notificações push ativadas com sucesso!" };
  } catch (error: unknown) {
    console.error("[savePushSubscriptionAction] Erro:", error);
    return {
      error: error instanceof Error ? error.message : "Erro ao ativar notificações.",
    };
  }
}

export async function sendTestPushAction(): Promise<ActionState> {
  try {
    const ctx = await getTenantContext();
    const result = await sendPushToUser(ctx.userId, {
      title: "FitFlow — Teste de Notificação",
      body: "Seu celular está configurado para receber notificações em segundo plano!",
      url: "/student/today",
    });

    if (result.sent === 0) {
      return {
        error: "Nenhum dispositivo cadastrado para este usuário. Ative as notificações no celular primeiro.",
      };
    }

    return { ok: true, message: `Notificação enviada com sucesso para ${result.sent} dispositivo(s)!` };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Erro ao disparar teste.",
    };
  }
}

/**
 * Dispara notificação de teste dos hábitos (Água, Alimentação, Sono).
 */
export async function sendHabitTestPushAction(
  type: "WATER" | "NUTRITION" | "SLEEP"
): Promise<ActionState> {
  try {
    const ctx = await getTenantContext();
    const habitData = {
      WATER: {
        title: "Hora de Hidratar! 💧",
        body: "Beba um copo d'água agora (300ml a 500ml) para manter seu rendimento muscular e acelerar sua recuperação.",
      },
      NUTRITION: {
        title: "Combustível do Corpo! 🥗",
        body: "Lembre-se de fazer uma refeição equilibrada e priorizar proteínas para alimentar seus músculos.",
      },
      SLEEP: {
        title: "Recuperação e Sono Reparador 🌙",
        body: "Hora de desacelerar das telas. O descanso de qualidade (7 a 8 horas) é onde seu corpo constrói músculos e renova sua saúde.",
      },
    }[type];

    const result = await sendPushToUser(ctx.userId, {
      title: habitData.title,
      body: habitData.body,
      url: "/student/today",
    });

    if (result.sent === 0) {
      return {
        error:
          "Nenhum celular cadastrado para receber notificações. Ative as notificações no topo da tela primeiro.",
      };
    }

    const label =
      type === "WATER"
        ? "Água"
        : type === "NUTRITION"
        ? "Alimentação"
        : "Sono";

    return {
      ok: true,
      message: `Notificação de ${label} enviada com sucesso para seu celular!`,
    };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Erro ao disparar lembrete.",
    };
  }
}
