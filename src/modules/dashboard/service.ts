import { prisma } from "@/lib/db";
import { BRAZIL_TIMEZONE } from "@/lib/date";
import { assertCoach, type TenantContext } from "@/server/auth/context";

/**
 * Semana operacional (segunda a domingo) calculada no fuso do Brasil, pois o produto é voltado a
 * personais brasileiros. Quando existir fuso por tenant, esta função passa a recebê-lo.
 */
export function startOfBusinessWeek(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  // Brasil não tem horário de verão desde 2019: offset fixo de -03:00.
  const localMidnight = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00-03:00`);
  return new Date(localMidnight.getTime() - weekdayIndex * 24 * 60 * 60 * 1000);
}

const INACTIVITY_DAYS = 7;

/** Todos os indicadores são consultas ao banco, sempre limitadas ao tenant do contexto. */
export async function getCoachDashboard(ctx: TenantContext) {
  assertCoach(ctx);
  const tenantId = ctx.tenantId;
  const weekStart = startOfBusinessWeek();
  const inactiveCutoff = new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);

  const [byStatus, activePrograms, sessionsThisWeek, atRisk, recentSessions] = await Promise.all([
    prisma.studentProfile.groupBy({
      by: ["status"],
      where: { tenantId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.trainingProgram.count({ where: { tenantId, isActive: true } }),
    prisma.workoutSession.count({
      where: { tenantId, status: "COMPLETED", completedAt: { gte: weekStart } },
    }),
    // Alunos ativos, cadastrados há mais de 7 dias, sem nenhum treino concluído nos últimos 7 dias.
    prisma.studentProfile.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: "ACTIVE",
        createdAt: { lt: inactiveCutoff },
        workoutSessions: { none: { status: "COMPLETED", completedAt: { gte: inactiveCutoff } } },
      },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    prisma.workoutSession.findMany({
      where: { tenantId, status: "COMPLETED" },
      select: {
        id: true,
        completedAt: true,
        totalVolumeKg: true,
        studentProfile: { select: { user: { select: { name: true } } } },
        trainingDay: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
  ]);

  const count = (status: string) => byStatus.find((row) => row.status === status)?._count._all ?? 0;

  return {
    totalStudents: count("ACTIVE") + count("PAUSED") + count("ARCHIVED"),
    activeStudents: count("ACTIVE"),
    pausedStudents: count("PAUSED"),
    activePrograms,
    sessionsThisWeek,
    atRiskStudents: atRisk.map((s) => ({ id: s.id, name: s.user.name ?? "Sem nome" })),
    recentActivity: recentSessions.map((s) => ({
      id: s.id,
      studentName: s.studentProfile.user.name ?? "Sem nome",
      workoutName: s.trainingDay.name,
      completedAt: s.completedAt,
      totalVolumeKg: s.totalVolumeKg ? Number(s.totalVolumeKg) : null,
    })),
  };
}
