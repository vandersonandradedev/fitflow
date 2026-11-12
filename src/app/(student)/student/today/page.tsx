import Link from "next/link";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ExerciseGuideDialog } from "@/components/ui/exercise-detail-dialog";
import { OfflineSyncBadge } from "@/components/ui/offline-sync-badge";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";
import { SafeImage } from "@/components/ui/safe-image";
import { prisma } from "@/lib/db";
import { formatBrazilTodayHeader, getBrazilDayOfWeek, sortDaysByWeekOrder } from "@/lib/date";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT,
  type DayOfWeekInput,
} from "@/modules/workouts/types";
import { requireStudentContext } from "@/server/auth/session";
import { startSessionAction } from "../session/actions";

export default async function StudentTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ dayId?: string; programId?: string }>;
}) {
  const ctx = await requireStudentContext();
  const params = await searchParams;

  const [activePrograms, inProgressSession] = await Promise.all([
    prisma.trainingProgram.findMany({
      where: {
        tenantId: ctx.tenantId,
        studentProfileId: ctx.studentProfileId,
        isActive: true,
        versions: { some: { status: "PUBLISHED" } },
      },
      select: {
        id: true,
        title: true,
        goal: true,
        description: true,
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { versionNumber: "desc" },
          take: 1,
          select: {
            id: true,
            versionNumber: true,
            trainingDays: {
              orderBy: { orderIndex: "asc" },
              select: {
                id: true,
                name: true,
                dayOfWeek: true,
                description: true,
                workoutExercises: {
                  orderBy: { orderIndex: "asc" },
                  select: {
                    id: true,
                    coachNotes: true,
                    exercise: {
                      select: {
                        name: true,
                        primaryMuscleGroup: true,
                        category: { select: { name: true } },
                        media: {
                          orderBy: { orderIndex: "asc" },
                          take: 1,
                          select: { url: true },
                        },
                        instructions: {
                          orderBy: { stepNumber: "asc" },
                          select: {
                            stepNumber: true,
                            instruction: true,
                            safetyTip: true,
                          },
                        },
                      },
                    },
                    sets: {
                      orderBy: { setNumber: "asc" },
                      select: {
                        id: true,
                        setNumber: true,
                        repsTarget: true,
                        suggestedLoadKg: true,
                        restSeconds: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workoutSession.findFirst({
      where: {
        tenantId: ctx.tenantId,
        studentProfileId: ctx.studentProfileId,
        status: "IN_PROGRESS",
      },
      select: {
        id: true,
        trainingDayId: true,
        startedAt: true,
        trainingDay: { select: { name: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const todayDow = getBrazilDayOfWeek();

  // 1. Prioriza o programa passado na URL
  let activeProgram = params.programId
    ? activePrograms.find((p) => p.id === params.programId)
    : undefined;

  // 2. Se há sessão em andamento, prioriza o programa da sessão
  if (!activeProgram && inProgressSession) {
    activeProgram = activePrograms.find((p) =>
      p.versions.some((v) =>
        v.trainingDays.some((d) => d.id === inProgressSession.trainingDayId)
      )
    );
  }

  // 3. Sincronização inteligente: prioriza o programa que tem treino agendado para HOJE
  if (!activeProgram) {
    activeProgram = activePrograms.find((p) =>
      p.versions[0]?.trainingDays.some((d) => d.dayOfWeek === todayDow)
    );
  }

  // 4. Se nenhum tem treino hoje, procura algum com dia livre (ANY)
  if (!activeProgram) {
    activeProgram = activePrograms.find((p) =>
      p.versions[0]?.trainingDays.some((d) => d.dayOfWeek === "ANY")
    );
  }

  // 5. Fallback: primeiro programa ativo
  if (!activeProgram) {
    activeProgram = activePrograms[0];
  }

  const publishedVersion = activeProgram?.versions[0];
  const sortedTrainingDays = publishedVersion
    ? sortDaysByWeekOrder(publishedVersion.trainingDays)
    : [];

  const trainingDay =
    (params.dayId
      ? sortedTrainingDays.find((d) => d.id === params.dayId)
      : undefined) ??
    (inProgressSession && sortedTrainingDays.some((d) => d.id === inProgressSession.trainingDayId)
      ? sortedTrainingDays.find((d) => d.id === inProgressSession.trainingDayId)
      : undefined) ??
    sortedTrainingDays.find((d) => d.dayOfWeek === todayDow) ??
    sortedTrainingDays.find((d) => d.dayOfWeek === "ANY") ??
    sortedTrainingDays[0];

  const totalDaySets = trainingDay
    ? trainingDay.workoutExercises.reduce((acc, w) => acc + w.sets.length, 0)
    : 0;

  const isTodayDay = Boolean(
    trainingDay && (trainingDay.dayOfWeek === todayDow || trainingDay.dayOfWeek === "ANY")
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">
              {formatBrazilTodayHeader()}
            </span>
            <span className="text-xs text-muted-foreground">· Olá, {ctx.userName?.split(" ")[0] ?? "Aluno"}</span>
            {isTodayDay && (
              <Badge variant="emerald" className="text-[10px] py-0 px-1.5 h-4">
                Hoje
              </Badge>
            )}
          </div>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
            {isTodayDay
              ? "Treino de Hoje"
              : `Rotina de ${DAY_OF_WEEK_LABELS[trainingDay?.dayOfWeek as DayOfWeekInput] ?? trainingDay?.name}`}
          </h1>
        </div>
        <OfflineSyncBadge />
      </div>

      <PushNotificationPrompt />

      {/* In-Progress Session Banner */}
      {inProgressSession && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-primary">Sessão em andamento</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {inProgressSession.trainingDay.name}
            </p>
          </div>
          <Link href={`/student/session/${inProgressSession.id}`} className="shrink-0">
            <Button size="touch" className="w-full sm:w-auto h-11">
              Continuar treino
            </Button>
          </Link>
        </div>
      )}

      {!activeProgram || !publishedVersion || !trainingDay ? (
        <EmptyState
          title="Nenhum treino publicado para hoje"
          description="Assim que seu personal trainer publicar sua periodização, seus exercícios e séries aparecerão aqui."
          action={
            <Link href="/student/week">
              <Button variant="outline" size="sm">
                Ver programação semanal
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Program Switcher (When student has multiple routines e.g. Treino + Alongamento) */}
          {activePrograms.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {activePrograms.map((p) => {
                const isSelected = p.id === activeProgram.id;
                return (
                  <Link
                    key={p.id}
                    href={`/student/today?programId=${p.id}`}
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

          {/* Active Training Day Focus Header */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="emerald">
                {activeProgram.title} · v{publishedVersion.versionNumber}
              </Badge>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {trainingDay.workoutExercises.length}{" "}
                {trainingDay.workoutExercises.length === 1 ? "exercício" : "exercícios"} ·{" "}
                {totalDaySets} {totalDaySets === 1 ? "série" : "séries"}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {trainingDay.name}
              </h2>
              {trainingDay.description && (
                <p className="mt-1 text-xs font-medium text-primary">
                  {trainingDay.description}
                </p>
              )}
              {activeProgram.goal && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Foco do ciclo: {activeProgram.goal}
                </p>
              )}
            </div>

            {inProgressSession && inProgressSession.trainingDayId === trainingDay.id ? (
              <Link href={`/student/session/${inProgressSession.id}`} className="block">
                <Button size="touch" className="w-full">
                  <Play className="h-4 w-4 fill-current" />
                  Continuar treino em andamento
                </Button>
              </Link>
            ) : (
              <form action={startSessionAction}>
                <input type="hidden" name="trainingDayId" value={trainingDay.id} />
                <Button type="submit" size="touch" className="w-full">
                  <Play className="h-4 w-4 fill-current" />
                  Iniciar treino agora
                </Button>
              </form>
            )}
          </section>

          {/* Day Switcher (Cronológico com indicador HOJE) */}
          {sortedTrainingDays.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {sortedTrainingDays.map((d) => {
                const active = d.id === trainingDay.id;
                const isToday = d.dayOfWeek === todayDow;
                const shortLabel =
                  DAY_OF_WEEK_SHORT[d.dayOfWeek as DayOfWeekInput] ?? d.dayOfWeek;
                return (
                  <Link
                    key={d.id}
                    href={`/student/today?programId=${activeProgram.id}&dayId=${d.id}`}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-all min-h-[42px] flex items-center gap-2 ${
                      active
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                      {shortLabel}
                    </span>
                    <span className="truncate max-w-[130px] sm:max-w-[200px]">
                      {d.name}
                    </span>
                    {isToday && (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground uppercase tracking-wide shrink-0">
                        Hoje
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Prescribed Exercises List */}
          <section className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">
              Exercícios prescritos ({trainingDay.workoutExercises.length})
            </h3>

            <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
              {trainingDay.workoutExercises.map((item, idx) => (
                <div key={item.id} className="p-4 space-y-3 transition-colors hover:bg-secondary/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 font-mono text-xs font-semibold text-primary tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      {item.exercise.media[0]?.url && (
                        <ExerciseGuideDialog
                          exercise={{
                            name: item.exercise.name,
                            categoryName: item.exercise.category.name,
                            primaryMuscleGroup: item.exercise.primaryMuscleGroup,
                            mediaUrl: item.exercise.media[0]?.url ?? null,
                            coachNotes: item.coachNotes,
                            instructions: item.exercise.instructions,
                          }}
                          triggerLabel=""
                          triggerVariant="ghost"
                          triggerClassName="p-0 h-auto rounded-md overflow-hidden shrink-0 group border border-border/80"
                        >
                          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg bg-[#090B0E] cursor-pointer flex items-center justify-center">
                            <SafeImage
                              src={item.exercise.media[0].url}
                              alt={item.exercise.name}
                              className="h-full w-full object-contain transition-transform group-hover:scale-105"
                              containerClassName="h-full w-full flex items-center justify-center"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                              <Play className="h-3.5 w-3.5 fill-white text-white drop-shadow" />
                            </div>
                          </div>
                        </ExerciseGuideDialog>
                      )}

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">
                          {item.exercise.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.exercise.category.name} · {item.exercise.primaryMuscleGroup}
                        </p>
                      </div>
                    </div>

                    <ExerciseGuideDialog
                      exercise={{
                        name: item.exercise.name,
                        categoryName: item.exercise.category.name,
                        primaryMuscleGroup: item.exercise.primaryMuscleGroup,
                        mediaUrl: item.exercise.media[0]?.url ?? null,
                        coachNotes: item.coachNotes,
                        instructions: item.exercise.instructions,
                      }}
                      triggerLabel="Detalhes"
                      triggerClassName="h-9 shrink-0 px-2.5 text-xs font-medium"
                    />
                  </div>

                  {item.coachNotes && (
                    <p className="border-l-2 border-primary/50 pl-3 text-xs text-muted-foreground">
                      {item.coachNotes}
                    </p>
                  )}

                  {/* Compact Sets Table (No nested boxes per set) */}
                  <div className="divide-y divide-border/60 rounded-md border border-border bg-background/60">
                    {item.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between px-3 py-2 text-xs"
                      >
                        <span className="font-mono font-semibold text-primary tabular-nums">
                          Série {set.setNumber}
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          {set.repsTarget} reps
                          {set.suggestedLoadKg
                            ? ` · ${Number(set.suggestedLoadKg)} kg`
                            : ""}
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {set.restSeconds}s desc.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
