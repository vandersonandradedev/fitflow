import { Calendar, CheckCircle2, Clock, Dumbbell, Flame, History, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudentSessionHistory } from "@/modules/sessions/service";
import { requireStudentContext } from "@/server/auth/session";

export default async function StudentHistoryPage() {
  const ctx = await requireStudentContext();
  const sessions = await listStudentSessionHistory(ctx);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[#9BA3AF]">Histórico de Atividades</p>
        <h1 className="text-xl font-bold tracking-tight text-[#F3F5F7]">
          Seus Treinos Concluídos
        </h1>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardContent className="p-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <History className="h-6 w-6" />
            </div>
            <h2 className="text-sm font-semibold text-[#F3F5F7]">
              Nenhum treino registrado ainda
            </h2>
            <p className="text-xs text-[#9BA3AF]">
              Execute e finalize uma sessão na aba <strong>Hoje</strong> para acompanhar seu histórico de cargas e volume aqui.
            </p>
          </CardContent>
        </Card>
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
              <Card
                key={session.id}
                className="border-[#242C3A] bg-[#12161D] overflow-hidden"
              >
                <CardHeader className="p-4 pb-3 border-b border-[#242C3A]/60 bg-[#161B24]">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="emerald" className="text-[10px]">
                          Concluído
                        </Badge>
                        <h2 className="text-base font-bold text-[#F3F5F7]">
                          {session.trainingDay.name}
                        </h2>
                      </div>
                      <p className="text-xs text-[#9BA3AF] mt-0.5 capitalize">
                        {dateStr}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {durationMinutes && (
                        <span className="flex items-center gap-1 font-mono text-emerald-400">
                          <Clock className="h-3.5 w-3.5" />
                          {durationMinutes} min
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-bold text-[#F3F5F7]">
                        <Flame className="h-3.5 w-3.5 text-amber-400" />
                        {volumeKg.toLocaleString("pt-BR")} kg
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {/* Feedback and RPE */}
                  {(session.perceivedExertionRpe || session.studentFeedback) && (
                    <div className="rounded-lg border border-[#242C3A] bg-[#090B0E]/60 p-3 text-xs space-y-1">
                      {session.perceivedExertionRpe && (
                        <p className="text-[#9BA3AF]">
                          Esforço Subjetivo:{" "}
                          <strong className="text-emerald-400 font-mono">
                            RPE {session.perceivedExertionRpe}/10
                          </strong>
                        </p>
                      )}
                      {session.studentFeedback && (
                        <p className="text-[#F3F5F7] italic flex items-start gap-1.5 pt-0.5">
                          <MessageSquare className="h-3.5 w-3.5 text-[#647082] shrink-0 mt-0.5" />
                          <span>&ldquo;{session.studentFeedback}&rdquo;</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Exercises & Logged Sets Breakdown */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#647082]">
                      {session.exerciseLogs.length} exercícios • {totalSets} séries realizadas
                    </p>

                    <div className="space-y-1.5">
                      {session.exerciseLogs.map((log) => {
                        const completedSets = log.setLogs.filter(
                          (s) => s.completed
                        );
                        return (
                          <div
                            key={log.id}
                            className="flex items-center justify-between rounded-lg border border-[#242C3A]/60 bg-[#090B0E]/60 px-3 py-2 text-xs"
                          >
                            <span className="font-semibold text-[#F3F5F7] truncate max-w-[180px]">
                              {log.exercise.name}
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5 justify-end">
                              {completedSets.map((s) => (
                                <span
                                  key={s.id}
                                  className="rounded bg-[#12161D] px-2 py-0.5 font-mono text-[11px] text-emerald-300 border border-emerald-500/20"
                                >
                                  {Number(s.actualLoadKg)}kg x {s.actualReps}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
