import { NextResponse } from "next/server";
import { runDatabaseMaintenance } from "@/modules/maintenance/cleanup";

export const dynamic = "force-dynamic";

/**
 * Endpoint de manutenção do banco de dados executável via Cron (ex: Vercel Cron / GitHub Actions).
 * Protegido por chave secreta:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Em produção, exige que o segredo esteja configurado e seja verificado
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Acesso não autorizado ao cron de manutenção." },
        { status: 401 }
      );
    }
  }

  try {
    const report = await runDatabaseMaintenance();

    return NextResponse.json({
      ok: true,
      report,
    });
  } catch (error) {
    console.error("[CRON_CLEANUP_ERROR]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro desconhecido na manutenção.",
      },
      { status: 500 }
    );
  }
}
