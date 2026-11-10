import { Dumbbell, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireStudentContext } from "@/server/auth/session";

export default async function StudentTodayPage() {
  const ctx = await requireStudentContext();

  const [studentUser, activeProgram] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { name: true } }),
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
                workoutExercises: {
                  orderBy: { orderIndex: "asc" },
                  select: {
                    id: true,
                    coachNotes: true,
                    exercise: { select: { name: true, primaryMuscleGroup: true } },
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
  ]);

  const publishedVersion = activeProgram?.versions[0];
  const trainingDay = publishedVersion?.trainingDays[0];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[#9BA3AF]">Olá, {studentUser.name ?? "Aluno"}</p>
        <h1 className="text-xl font-bold tracking-tight text-[#F3F5F7]">Treino do Dia</h1>
      </div>

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
              Assim que seu personal trainer publicar seu programa de treinamento, seus exercícios e séries aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-[#162024] to-[#12161D] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <Badge variant="emerald" className="text-xs">
                {activeProgram.title} • v{publishedVersion.versionNumber}
              </Badge>
            </div>

            <h2 className="mt-2 text-lg font-bold tracking-tight text-[#F3F5F7]">
              {trainingDay.name}
            </h2>
            {activeProgram.goal && (
              <p className="mt-1 text-xs text-[#9BA3AF]">Objetivo: {activeProgram.goal}</p>
            )}
          </div>

          <div className="space-y-4">
            {trainingDay.workoutExercises.map((item, idx) => (
              <Card key={item.id} className="border-[#242C3A] bg-[#12161D] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#242C3A]/60 p-3.5 bg-[#161B24]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-sm text-[#F3F5F7]">
                        {item.exercise.name}
                      </h3>
                      <p className="text-[11px] text-[#9BA3AF]">
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
                          {set.suggestedLoadKg ? ` • ${Number(set.suggestedLoadKg)} kg` : ""}
                        </span>
                        <span className="text-[#9BA3AF]">{set.restSeconds}s descanso</span>
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
