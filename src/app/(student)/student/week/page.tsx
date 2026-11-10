import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
        <p className="text-xs text-muted-foreground">Programação semanal</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sua divisão de treinos
        </h1>
      </div>

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
            {publishedVersion.trainingDays.map((day, index) => {
              const totalSets = day.workoutExercises.reduce(
                (acc, wex) => acc + wex.sets.length,
                0
              );

              return (
                <li key={day.id}>
                  <Link
                    href={`/student/today?dayId=${day.id}`}
                    className="flex min-h-[64px] items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-10 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-xs font-semibold text-primary">
                        {DAY_OF_WEEK_SHORT[day.dayOfWeek as DayOfWeekInput] ??
                          `D${index + 1}`}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {day.name}
                        </p>
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
