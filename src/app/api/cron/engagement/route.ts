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
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");

  // Vercel Cron envia cabeçalho "x-vercel-cron: 1" em invocações automáticas de agendamento
  const isVercelCron =
    request.headers.get("x-vercel-cron") === "1" ||
    request.headers.get("user-agent")?.includes("vercel-cron");

  const isAuthorized =
    !cronSecret ||
    isVercelCron ||
    authHeader === `Bearer ${cronSecret}` ||
    keyParam === cronSecret;

  if (!isAuthorized) {
    console.warn("[cron] Tentativa de acesso não autorizado ao cron de engajamento.");
    return NextResponse.json(
      { error: "Acesso não autorizado ao cron de engajamento." },
      { status: 401 }
    );
  }

  try {
    const habitParam = (url.searchParams.get("habit")?.toUpperCase() as
      | "AUTO"
      | "WATER"
      | "NUTRITION"
      | "SLEEP"
      | "EVENING"
      | "ALL"
      | null) ?? "AUTO";

    console.log(`[cron] Executando cron de engajamento — modo: ${habitParam}`);

    const [reminders, churnAlerts, habits] = await Promise.all([
      dispatchMorningWorkoutReminders(),
      dispatchChurnAlerts(),
      dispatchHabitReminders(habitParam),
    ]);

    console.log(`[cron] Execução finalizada com sucesso.`, {
      reminders,
      churnAlerts,
      habits,
    });

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
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
