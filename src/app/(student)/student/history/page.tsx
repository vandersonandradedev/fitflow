import Link from "next/link";
import { Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { OfflineSyncBadge } from "@/components/ui/offline-sync-badge";
import { prisma } from "@/lib/db";
import { listStudentSessionHistory } from "@/modules/sessions/service";
import { requireStudentContext } from "@/server/auth/session";
import { ShareStoryButton } from "./share-story-button";

export default async function StudentHistoryPage() {
  const ctx = await requireStudentContext();
  const [sessions, studentUser] = await Promise.all([
    listStudentSessionHistory(ctx),
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Histórico de atividades</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Seus treinos concluídos
          </h1>
        </div>
        <OfflineSyncBadge />
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="Nenhum treino registrado ainda"
          description="Execute e finalize uma sessão na aba Hoje para acompanhar seu histórico de cargas e volume aqui."
          action={
            <Link href="/student/today">
              <Button variant="outline" size="sm">
                Ir para Treino de Hoje
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const dateStr = session.completedAt
              ? new Date(session.completedAt).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Concluído";

            const durationMinutes = session.totalDurationSeconds
              ? Math.max(1, Math.round(session.totalDurationSeconds / 60))
              : null;

            const volumeKg = session.totalVolumeKg
              ? Number(session.totalVolumeKg)
              : 0;

            const totalSets = session.exerciseLogs.reduce(
              (acc, ex) => acc + ex.setLogs.filter((s) => s.completed).length,
              0
            );

            return (
              <section
                key={session.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                <div className="flex flex-col gap-1.5 border-b border-border bg-popover/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="emerald">Concluído</Badge>
                      <h2 className="text-sm font-semibold text-foreground">
                        {session.trainingDay.name}
                      </h2>
                    </div>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {dateStr}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                      {durationMinutes && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Clock className="h-3.5 w-3.5" />
                          {durationMinutes} min
                        </span>
                      )}
                      <span className="font-semibold text-foreground">
                        {volumeKg.toLocaleString("pt-BR")} kg
                      </span>
                    </div>

                    <ShareStoryButton
                      data={{
                        workoutName: session.trainingDay.name,
                        studentName: studentUser?.name ?? "Aluno",
                        dateStr,
                        totalVolumeKg: volumeKg,
                        durationMinutes: durationMinutes ?? 45,
                        completedSetsCount: totalSets,
                        totalSetsCount: totalSets,
                        rpe: session.perceivedExertionRpe,
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {(session.perceivedExertionRpe || session.studentFeedback) && (
                    <div className="border-l-2 border-primary/50 pl-3 text-xs space-y-1">
                      {session.perceivedExertionRpe && (
                        <p className="text-muted-foreground">
                          Esforço subjetivo:{" "}
                          <strong className="font-mono text-primary">
                            RPE {session.perceivedExertionRpe}/10
                          </strong>
                        </p>
                      )}
                      {session.studentFeedback && (
                        <p className="flex items-start gap-1.5 text-foreground">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>&ldquo;{session.studentFeedback}&rdquo;</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {session.exerciseLogs.length} exercícios · {totalSets} séries realizadas
                    </p>

                    <ul className="divide-y divide-border/70 border-t border-border">
                      {session.exerciseLogs.map((log) => {
                        const completedSets = log.setLogs.filter((s) => s.completed);
                        return (
                          <li
                            key={log.id}
                            className="flex flex-col gap-1.5 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="font-medium text-foreground">
                              {log.exercise.name}
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                              {completedSets.map((s) => (
                                <span
                                  key={s.id}
                                  className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[11px] tabular-nums text-primary"
                                >
                                  {Number(s.actualLoadKg)}kg × {s.actualReps}
                                </span>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
