import Link from "next/link";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ExerciseGuideDialog } from "@/components/ui/exercise-detail-dialog";
import { prisma } from "@/lib/db";
import { requireStudentContext } from "@/server/auth/session";
import { startSessionAction } from "../session/actions";

const JS_DAY_TO_ENUM = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export default async function StudentTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ dayId?: string }>;
}) {
  const ctx = await requireStudentContext();
  const params = await searchParams;

  const [studentUser, activeProgram, inProgressSession] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: { name: true },
    }),
    prisma.trainingProgram.findFirst({
      where: {
        tenantId: ctx.tenantId,
        studentProfileId: ctx.studentProfileId,
        isActive: true,
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

  const publishedVersion = activeProgram?.versions[0];
  const todayDow = JS_DAY_TO_ENUM[new Date().getDay()];
  const trainingDay =
    (params.dayId
      ? publishedVersion?.trainingDays.find((d) => d.id === params.dayId)
      : undefined) ??
    (inProgressSession
      ? publishedVersion?.trainingDays.find((d) => d.id === inProgressSession.trainingDayId)
      : undefined) ??
    publishedVersion?.trainingDays.find((d) => d.dayOfWeek === todayDow) ??
    publishedVersion?.trainingDays[0];

  const totalDaySets = trainingDay
    ? trainingDay.workoutExercises.reduce((acc, w) => acc + w.sets.length, 0)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Olá, {studentUser.name ?? "Aluno"}</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Treino de Hoje
        </h1>
      </div>

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
          {/* Active Training Day Focus Header */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="emerald">
                {activeProgram.title} · v{publishedVersion.versionNumber}
              </Badge>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {trainingDay.workoutExercises.length} exercícios · {totalDaySets} séries
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

          {/* Day Switcher (Sharp tabs, touch-friendly) */}
          {publishedVersion.trainingDays.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {publishedVersion.trainingDays.map((d) => {
                const active = d.id === trainingDay.id;
                return (
                  <Link
                    key={d.id}
                    href={`/student/today?dayId=${d.id}`}
                    className={`shrink-0 rounded-md border px-3 py-2 text-xs font-medium transition-colors min-h-[38px] inline-flex items-center ${
                      active
                        ? "border-primary/40 bg-secondary text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d.name}
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
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="mt-0.5 font-mono text-xs font-semibold text-primary tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
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
                      triggerClassName="h-9 shrink-0 px-2.5 text-xs"
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
