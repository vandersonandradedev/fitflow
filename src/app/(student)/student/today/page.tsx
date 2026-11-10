import Link from "next/link";
import { Calendar, Dumbbell, Flame, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <p className="text-xs text-[#9BA3AF]">Olá, {studentUser.name ?? "Aluno"}</p>
        <h1 className="text-xl font-bold tracking-tight text-[#F3F5F7]">
          Treino de Hoje
        </h1>
      </div>

      {/* In-Progress Session Notification Banner */}
      {inProgressSession && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs shadow-md">
          <div className="space-y-0.5">
            <span className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Flame className="h-4 w-4 animate-pulse text-emerald-400" />
              Sessão em Andamento
            </span>
            <p className="text-[#9BA3AF]">{inProgressSession.trainingDay.name}</p>
          </div>
          <Link href={`/student/session/${inProgressSession.id}`}>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs h-8">
              Continuar Treino →
            </Button>
          </Link>
        </div>
      )}

      {!activeProgram || !publishedVersion || !trainingDay ? (
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardContent className="p-6 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold text-[#F3F5F7]">
              Nenhum treino publicado para hoje
            </h2>
            <p className="text-xs text-[#9BA3AF]">
              Assim que seu personal trainer publicar sua periodização, seus exercícios e séries aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Training Day Hero Banner */}
          <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-[#141F23] to-[#12161D] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="emerald" className="text-xs">
                {activeProgram.title} • v{publishedVersion.versionNumber}
              </Badge>
              <span className="text-xs text-[#9BA3AF]">
                {trainingDay.workoutExercises.length} exercícios • {totalDaySets} séries
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#F3F5F7]">
                {trainingDay.name}
              </h2>
              {trainingDay.description && (
                <p className="mt-1 text-xs text-emerald-300">
                  {trainingDay.description}
                </p>
              )}
              {activeProgram.goal && (
                <p className="mt-0.5 text-xs text-[#9BA3AF]">
                  Foco do Ciclo: {activeProgram.goal}
                </p>
              )}
            </div>

            {/* Main Action: Start or Continue Workout */}
            {inProgressSession && inProgressSession.trainingDayId === trainingDay.id ? (
              <Link href={`/student/session/${inProgressSession.id}`}>
                <Button className="w-full h-12 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20 gap-2">
                  <Play className="h-5 w-5 fill-current" />
                  Continuar Treino em Andamento
                </Button>
              </Link>
            ) : (
              <form action={startSessionAction}>
                <input type="hidden" name="trainingDayId" value={trainingDay.id} />
                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20 gap-2"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Iniciar Treino Agora
                </Button>
              </form>
            )}
          </div>

          {/* Quick Days Switcher (if program has multiple days) */}
          {publishedVersion.trainingDays.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {publishedVersion.trainingDays.map((d) => {
                const active = d.id === trainingDay.id;
                return (
                  <Link
                    key={d.id}
                    href={`/student/today?dayId=${d.id}`}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-emerald-500 text-black font-semibold"
                        : "border border-[#242C3A] bg-[#12161D] text-[#9BA3AF] hover:text-[#F3F5F7]"
                    }`}
                  >
                    {d.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Exercises Preview List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#647082] px-1">
              Exercícios Prescritos
            </h3>

            {trainingDay.workoutExercises.map((item, idx) => (
              <Card
                key={item.id}
                className="border-[#242C3A] bg-[#12161D] overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-[#242C3A]/60 p-3.5 bg-[#161B24]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-[#F3F5F7]">
                        {item.exercise.name}
                      </h4>
                      <p className="text-[11px] text-[#9BA3AF]">
                        {item.exercise.category.name} •{" "}
                        {item.exercise.primaryMuscleGroup}
                      </p>
                    </div>
                  </div>
                  <Dumbbell className="h-4 w-4 text-[#647082]" />
                </div>

                <CardContent className="p-3.5 space-y-2.5">
                  {item.coachNotes && (
                    <p className="text-xs text-[#9BA3AF] italic bg-[#090B0E]/60 p-2 rounded border border-[#242C3A]/40">
                      {item.coachNotes}
                    </p>
                  )}

                  <div className="space-y-1.5">
                    {item.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between rounded-lg border border-[#242C3A]/60 bg-[#090B0E]/60 p-2.5 text-xs"
                      >
                        <span className="font-mono font-bold text-[#F3F5F7]">
                          Série #{set.setNumber}
                        </span>
                        <span className="text-[#F3F5F7]">
                          {set.repsTarget} reps
                          {set.suggestedLoadKg
                            ? ` • ${Number(set.suggestedLoadKg)} kg`
                            : ""}
                        </span>
                        <span className="text-[#9BA3AF]">
                          {set.restSeconds}s descanso
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
