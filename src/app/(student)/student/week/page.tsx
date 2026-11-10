import Link from "next/link";
import { Calendar, ChevronRight, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedProgramForStudent } from "@/modules/workouts/service";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT,
  type DayOfWeekInput,
} from "@/modules/workouts/types";
import { requireStudentContext } from "@/server/auth/session";

export default async function StudentWeeklySchedulePage() {
  const ctx = await requireStudentContext();
  const activeProgram = await getPublishedProgramForStudent(ctx);
  const publishedVersion = activeProgram?.versions[0];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[#9BA3AF]">Programação Semanal</p>
        <h1 className="text-xl font-bold tracking-tight text-[#F3F5F7]">
          Sua Divisão de Treinos
        </h1>
      </div>

      {!activeProgram || !publishedVersion ? (
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardContent className="p-6 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold text-[#F3F5F7]">
              Nenhuma programação publicada
            </h2>
            <p className="text-xs text-[#9BA3AF]">
              Seu personal trainer ainda não publicou uma rotina ativa para esta semana.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-xl border border-emerald-500/25 bg-[#12161D] p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F3F5F7]">
                {activeProgram.title}
              </span>
              <Badge variant="emerald" className="text-[10px]">
                v{publishedVersion.versionNumber}
              </Badge>
            </div>
            {activeProgram.goal && (
              <p className="text-xs text-emerald-400">Foco: {activeProgram.goal}</p>
            )}
            {activeProgram.description && (
              <p className="text-xs text-[#9BA3AF]">{activeProgram.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {publishedVersion.trainingDays.map((day, index) => {
              const totalSets = day.workoutExercises.reduce(
                (acc, wex) => acc + wex.sets.length,
                0
              );

              return (
                <Link
                  key={day.id}
                  href={`/student/today?dayId=${day.id}`}
                  className="flex items-center justify-between rounded-xl border border-[#242C3A] bg-[#12161D] p-4 transition-colors hover:border-emerald-500/40"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <span className="text-[10px] font-bold uppercase">
                        {DAY_OF_WEEK_SHORT[day.dayOfWeek as DayOfWeekInput] ??
                          `D${index + 1}`}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-[#F3F5F7]">
                        {day.name}
                      </p>
                      <p className="text-xs text-[#9BA3AF]">
                        {DAY_OF_WEEK_LABELS[day.dayOfWeek as DayOfWeekInput] ??
                          day.dayOfWeek}{" "}
                        • {day.workoutExercises.length} exercícios • {totalSets}{" "}
                        séries
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <Dumbbell className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
