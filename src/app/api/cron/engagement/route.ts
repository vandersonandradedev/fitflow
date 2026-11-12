import { NextResponse } from "next/server";
import {
  dispatchChurnAlerts,
  dispatchHabitReminders,
  dispatchMorningWorkoutReminders,
} from "@/modules/notifications/service";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Engajamento e Lembretes executável via Cron (ex: Vercel Cron às 07:00 da manhã).
 * - Envia lembrete matinal para alunos que treinam hoje.
 * - Envia alerta de churn para personal trainers sobre alunos inativos há mais de 4 dias.
 * - Envia lembretes de hábitos saudáveis (Água, Alimentação e Sono).
 *
 * Suporta filtro via query param: ?habit=water|nutrition|sleep|all|auto
 *
 * Protegido por chave secreta:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Acesso não autorizado ao cron de engajamento." },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const habitParam = (url.searchParams.get("habit")?.toUpperCase() as
      | "AUTO"
      | "WATER"
      | "NUTRITION"
      | "SLEEP"
      | "ALL"
      | null) ?? "AUTO";

    const [reminders, churnAlerts, habits] = await Promise.all([
      dispatchMorningWorkoutReminders(),
      dispatchChurnAlerts(),
      dispatchHabitReminders(habitParam),
    ]);

    return NextResponse.json({
      ok: true,
      reminders,
      churnAlerts,
      habits,
    });
  } catch (error) {
    console.error("[CRON_ENGAGEMENT_ERROR]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido no cron de engajamento.",
      },
      { status: 500 }
    );
  }
}
