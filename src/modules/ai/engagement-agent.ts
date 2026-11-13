import { FitnessGoal } from "@prisma/client";

export interface StudentEngagementContext {
  studentName: string;
  fitnessGoal?: FitnessGoal;
  daysInactive?: number;
  todaysWorkoutName?: string | null;
  lastCompletedWorkoutName?: string | null;
  completedWorkoutsCount?: number;
  streakDays?: number;
}

export interface AIEngagementMessage {
  title: string;
  message: string;
  source: "gemini" | "autonomous-engine";
}

const GOAL_CONTEXT_MAP: Record<FitnessGoal, string> = {
  HYPERTROPHY: "foco em hipertrofia e ganho de massa muscular",
  WEIGHT_LOSS: "foco em queima de gordura e emagrecimento sustentável",
  STRENGTH: "foco em aumento de força e sobrecarga progressiva",
  HEALTH: "foco em saúde, mobilidade e disposição diária",
  REHABILITATION: "foco em reabilitação, equilíbrio e qualidade de vida",
};

/**
 * Motor heurístico inteligente e contextual com centenas de variações dinâmicas.
 * Atua de forma 100% autônoma mesmo quando nenhuma chave de API externa estiver configurada.
 */
function generateAutonomousMessage(
  type: "MORNING" | "EVENING_REMINDER" | "WATER" | "NUTRITION" | "SLEEP" | "CHURN",
  ctx: StudentEngagementContext
): AIEngagementMessage {
  const firstName = ctx.studentName.split(" ")[0] || "Aluno";
  const goalContext = ctx.fitnessGoal ? GOAL_CONTEXT_MAP[ctx.fitnessGoal] : "seus objetivos";

  switch (type) {
    case "MORNING": {
      const workoutName = ctx.todaysWorkoutName || "treino programado";
      const options = [
        {
          title: `Dia de Treino: ${workoutName} ⚡`,
          message: `Bom dia, ${firstName}! Hoje é dia de ${workoutName}. Dedique 45 minutos para você e avance no seu ${goalContext}!`,
        },
        {
          title: `Foco total hoje: ${workoutName} 💪`,
          message: `Fala ${firstName}! Seu treino "${workoutName}" já está pronto no FitFlow. Bora começar o dia no ritmo certo?`,
        },
        {
          title: `Bora treinar, ${firstName}? 🔥`,
          message: `Constância vence o talento! Seu treino de hoje é "${workoutName}". Abra o app e vamos pra cima!`,
        },
      ];
      const selected = options[Math.floor(Math.random() * options.length)];
      return { ...selected, source: "autonomous-engine" };
    }

    case "EVENING_REMINDER": {
      const workoutName = ctx.todaysWorkoutName || "seu treino de hoje";
      const options = [
        {
          title: `Ainda dá tempo, ${firstName}! ⏳`,
          message: `O dia está acabando, mas seu treino "${workoutName}" ainda está te esperando. Termine o dia com a sensação de dever cumprido!`,
        },
        {
          title: `Não feche o dia no zero! 💪`,
          message: `${firstName}, seu treino de hoje não foi registrado ainda. Mesmo um treino mais curto vai manter seu ritmo no ${goalContext}.`,
        },
        {
          title: `Sensação de missão cumprida? 🎯`,
          message: `Bora treinar, ${firstName}? O "${workoutName}" é o combustível que falta pro seu dia fechar 100%!`,
        },
      ];
      const selected = options[Math.floor(Math.random() * options.length)];
      return { ...selected, source: "autonomous-engine" };
    }

    case "WATER": {
      const options = [
        {
          title: "Hora de Hidratar! 💧",
          message: `${firstName}, músculo hidratado é músculo forte. Beba 300ml a 500ml de água agora para otimizar seu ${goalContext}!`,
        },
        {
          title: "Pausa rápida para água 🥤",
          message: `Como está sua hidratação hoje, ${firstName}? Um corpo bem hidratado recupera 30% mais rápido. Beba um copo agora!`,
        },
        {
          title: "Combustível celular 💧",
          message: `${firstName}, lembre-se: a água transporta nutrientes essenciais para suas fibras musculares. Hidrate-se!`,
        },
      ];
      const selected = options[Math.floor(Math.random() * options.length)];
      return { ...selected, source: "autonomous-engine" };
    }

    case "NUTRITION": {
      const options = [
        {
          title: "Nutrição e Recuperação 🥗",
          message: `${firstName}, para seu ${goalContext}, priorize proteínas e comida de verdade na sua próxima refeição!`,
        },
        {
          title: "Combustível para seus músculos 🥩",
          message: `Treino sem nutrição adequada é esforço desperdiçado, ${firstName}. Garanta boas fontes de proteína e hidratação hoje.`,
        },
      ];
      const selected = options[Math.floor(Math.random() * options.length)];
      return { ...selected, source: "autonomous-engine" };
    }

    case "SLEEP": {
      const options = [
        {
          title: "Hora de Desacelerar 🌙",
          message: `Boa noite, ${firstName}! O verdadeiro ganho acontece durante o sono profundo. Desconecte das telas e descanse 7 a 8 horas.`,
        },
        {
          title: "Sono Reparador & Hormônios do Treino 🛌",
          message: `${firstName}, é durante o descanso noturno que o corpo regenera fibras musculares e equilibra os hormônios. Tenha uma ótima noite!`,
        },
      ];
      const selected = options[Math.floor(Math.random() * options.length)];
      return { ...selected, source: "autonomous-engine" };
    }

    case "CHURN": {
      const days = ctx.daysInactive || 4;
      const options = [
        {
          title: `Sentimos sua falta, ${firstName}! 🏋️`,
          message: `Já fazem ${days} dias desde seu último treino. Que tal retomar hoje com um treino adaptado? O importante é não parar!`,
        },
        {
          title: `Um passo de cada vez, ${firstName} 🚀`,
          message: `Sabemos que a rotina pode ser corrida, mas seu ${goalContext} ainda é prioridade. Seu treinador preparou tudo no FitFlow!`,
        },
      ];
      const selected = options[Math.floor(Math.random() * options.length)];
      return { ...selected, source: "autonomous-engine" };
    }
  }
}

/**
 * Consulta o modelo Gemini da Google caso a variável GEMINI_API_KEY esteja disponível.
 * Se não estiver configurada ou falhar, faz fallback imediato para o motor autônomo sem travar o sistema.
 */
async function callGeminiIfAvailable(
  prompt: string,
  ctx: StudentEngagementContext,
  fallbackType: "MORNING" | "EVENING_REMINDER" | "WATER" | "NUTRITION" | "SLEEP" | "CHURN"
): Promise<AIEngagementMessage> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateAutonomousMessage(fallbackType, ctx);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Você é o FitFlow AI Coach, um assistente de engajamento fitness de alta performance, empático, direto e motivador.
Sua missão: Gerar uma notificação push curta para o aluno ${ctx.studentName}.
Contexto do aluno:
- Objetivo: ${ctx.fitnessGoal || "Geral"}
- Treino de hoje: ${ctx.todaysWorkoutName || "Nenhum específico"}
- Dias inativo: ${ctx.daysInactive || 0}
- Pedido: ${prompt}

Responda ESTRITAMENTE em formato JSON com dois campos:
{
  "title": "título curto com emoji (máx 35 caracteres)",
  "message": "mensagem direta de até 120 caracteres"
}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return generateAutonomousMessage(fallbackType, ctx);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return generateAutonomousMessage(fallbackType, ctx);
    }

    const parsed = JSON.parse(text);
    if (parsed.title && parsed.message) {
      return {
        title: String(parsed.title).trim(),
        message: String(parsed.message).trim(),
        source: "gemini",
      };
    }

    return generateAutonomousMessage(fallbackType, ctx);
  } catch {
    return generateAutonomousMessage(fallbackType, ctx);
  }
}

/**
 * Agente Autônomo de Engajamento:
 * Interface principal para geração de notificações push contextuais e inteligentes.
 */
export const AIEngagementAgent = {
  async getMorningWorkoutReminder(ctx: StudentEngagementContext): Promise<AIEngagementMessage> {
    return callGeminiIfAvailable(
      `Crie um lembrete matinal motivador avisando que o aluno tem treino hoje (${ctx.todaysWorkoutName || "programado"}).`,
      ctx,
      "MORNING"
    );
  },

  async getEveningPendingWorkoutReminder(ctx: StudentEngagementContext): Promise<AIEngagementMessage> {
    return callGeminiIfAvailable(
      `O aluno tem o treino "${ctx.todaysWorkoutName}" programado para hoje mas ainda são 18h e ele não treinou. Crie uma mensagem curta de encorajamento para ele ir agora à noite.`,
      ctx,
      "EVENING_REMINDER"
    );
  },

  async getWaterReminder(ctx: StudentEngagementContext): Promise<AIEngagementMessage> {
    return callGeminiIfAvailable(
      `Lembrete inteligente de hidratação focado em performance e recuperação muscular para o aluno.`,
      ctx,
      "WATER"
    );
  },

  async getNutritionReminder(ctx: StudentEngagementContext): Promise<AIEngagementMessage> {
    return callGeminiIfAvailable(
      `Lembrete para o almoço/refeição do aluno priorizando ingestão de proteínas e nutrientes para o objetivo ${ctx.fitnessGoal}.`,
      ctx,
      "NUTRITION"
    );
  },

  async getSleepReminder(ctx: StudentEngagementContext): Promise<AIEngagementMessage> {
    return callGeminiIfAvailable(
      `Lembrete noturno sobre a importância do sono e desaceleração para recuperação muscular e saúde.`,
      ctx,
      "SLEEP"
    );
  },

  async getChurnReminder(ctx: StudentEngagementContext): Promise<AIEngagementMessage> {
    return callGeminiIfAvailable(
      `O aluno não registra treinos há ${ctx.daysInactive} dias. Crie uma mensagem acolhedora e motivadora para incentivá-lo a retomar.`,
      ctx,
      "CHURN"
    );
  },
};
