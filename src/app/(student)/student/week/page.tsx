import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/db";
import { getBrazilDayOfWeek, sortDaysByWeekOrder } from "@/lib/date";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT,
  type DayOfWeekInput,
} from "@/modules/workouts/types";
import { requireStudentContext } from "@/server/auth/session";

export default async function StudentWeeklySchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string }>;
}) {
  const ctx = await requireStudentContext();
  const params = await searchParams;

  const activePrograms = await prisma.trainingProgram.findMany({
    where: {
      tenantId: ctx.tenantId,
      studentProfileId: ctx.studentProfileId,
      isActive: true,
      versions: { some: { status: "PUBLISHED" } },
    },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          trainingDays: {
            orderBy: { orderIndex: "asc" },
            include: {
              workoutExercises: {
                select: { id: true, sets: { select: { id: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const todayDow = getBrazilDayOfWeek();

  const activeProgram =
    (params.programId
      ? activePrograms.find((p) => p.id === params.programId)
      : undefined) ??
    activePrograms.find((p) =>
      p.versions[0]?.trainingDays.some((d) => d.dayOfWeek === todayDow)
    ) ??
    activePrograms[0];

  const publishedVersion = activeProgram?.versions[0];
  const sortedTrainingDays = publishedVersion
    ? sortDaysByWeekOrder(publishedVersion.trainingDays)
    : [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Programação semanal</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sua divisão de treinos
        </h1>
      </div>

      {activePrograms.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {activePrograms.map((p) => {
            const isSelected = p.id === activeProgram?.id;
            return (
              <Link
                key={p.id}
                href={`/student/week?programId=${p.id}`}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border"
                }`}
              >
                {p.title}
              </Link>
            );
          })}
        </div>
      )}

      {!activeProgram || !publishedVersion ? (
        <EmptyState
          title="Nenhuma programação publicada"
          description="Seu personal trainer ainda não publicou uma rotina ativa para esta semana."
        />
      ) : (
        <>
          <section className="rounded-lg border border-border bg-card p-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                {activeProgram.title}
              </span>
              <Badge variant="emerald" className="font-mono">
                v{publishedVersion.versionNumber}
              </Badge>
            </div>
            {activeProgram.goal && (
              <p className="text-xs text-primary">Foco: {activeProgram.goal}</p>
            )}
            {activeProgram.description && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {activeProgram.description}
              </p>
            )}
          </section>

          <ul className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
            {sortedTrainingDays.map((day, index) => {
              const isToday = day.dayOfWeek === todayDow;
              const totalSets = day.workoutExercises.reduce(
                (acc, wex) => acc + wex.sets.length,
                0
              );

              return (
                <li key={day.id}>
                  <Link
                    href={`/student/today?programId=${activeProgram.id}&dayId=${day.id}`}
                    className={`flex min-h-[64px] items-center justify-between gap-3 px-4 py-3.5 transition-colors ${
                      isToday
                        ? "bg-emerald-500/[0.08] border-l-4 border-l-primary hover:bg-emerald-500/[0.12]"
                        : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-11 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold ${
                          isToday
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-primary"
                        }`}
                      >
                        {DAY_OF_WEEK_SHORT[day.dayOfWeek as DayOfWeekInput] ??
                          `D${index + 1}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {day.name}
                          </p>
                          {isToday && (
                            <Badge variant="emerald" className="text-[10px] py-0 px-1.5 h-4">
                              Hoje
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {DAY_OF_WEEK_LABELS[day.dayOfWeek as DayOfWeekInput] ??
                            day.dayOfWeek}{" "}
                          ·{" "}
                          <span className="font-mono tabular-nums">
                            {day.workoutExercises.length} exerc. · {totalSets} séries
                          </span>
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
