"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Play,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseGuideDialog } from "@/components/ui/exercise-detail-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RestChronometer } from "@/components/ui/rest-chronometer";
import { SafeImage } from "@/components/ui/safe-image";
import { StoryCardDialog } from "@/components/ui/story-card-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  clearActiveSessionOffline,
  enqueuePendingSessionOffline,
  loadActiveSessionOffline,
  saveActiveSessionOffline,
  subscribeNetworkStatus,
  syncPendingSessionsOffline,
} from "@/lib/offline-sync";
import { abandonSessionAction, finishSessionAction } from "../actions";

export interface RunnerSet {
  id?: string;
  setNumber: number;
  prescribedLoadKg?: number | null;
  actualLoadKg: number;
  prescribedReps?: string | null;
  actualReps: number;
  completed: boolean;
  restTakenSeconds?: number | null;
  rpe?: number | null;
}

export interface RunnerExercise {
  id?: string;
  exerciseId: string;
  workoutExerciseId?: string | null;
  name: string;
  primaryMuscleGroup: string;
  categoryName: string;
  mediaUrl?: string | null;
  coachNotes?: string | null;
  instructions: Array<{ stepNumber: number; instruction: string; safetyTip?: string | null }>;
  sets: RunnerSet[];
}

export interface LastPerformanceSet {
  setNumber: number;
  loadKg: number;
  reps: number;
}

const RPE_DESCRIPTIONS: Record<number, string> = {
  1: "Mínimo — Sem esforço perceptível",
  2: "Muito leve — Recuperação ativa",
  3: "Leve — Aquecimento confortável",
  4: "Moderado baixo — Ritmo sustentável",
  5: "Moderado — Frequência cardíaca elevada",
  6: "Moderado alto — Começando a pesar",
  7: "Difícil — 3 repetições na reserva (RIR 3)",
  8: "Muito difícil — 2 repetições na reserva (RIR 2)",
  9: "Quase máximo — 1 repetição na reserva (RIR 1)",
  10: "Máximo absoluto — Esforço até a falha muscular",
};

export function WorkoutRunner({
  sessionId,
  dayName,
  dayDescription,
  startedAtIso,
  initialExercises,
  lastPerformanceMap,
  studentName,
}: {
  sessionId: string;
  dayName: string;
  dayDescription?: string | null;
  startedAtIso: string;
  initialExercises: RunnerExercise[];
  lastPerformanceMap: Record<string, LastPerformanceSet[]>;
  studentName?: string | null;
}) {
  const router = useRouter();

  const [exercises, setExercises] = useState<RunnerExercise[]>(initialExercises);
  const [hydratedStorage, setHydratedStorage] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSavedNotification, setOfflineSavedNotification] = useState(false);
  const [showCelebrationDialog, setShowCelebrationDialog] = useState(false);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [restTimer, setRestTimer] = useState<{
    key: number;
    active: boolean;
    remaining: number;
    total: number;
    nextSetLabel?: string;
  }>({
    key: 0,
    active: false,
    remaining: 0,
    total: 60,
  });

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpe, setRpe] = useState<number>(8);
  const [studentFeedback, setStudentFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inicializa conexão de rede e carrega dados locais
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const unsubscribe = subscribeNetworkStatus(async (online) => {
      setIsOnline(online);
      if (online) {
        // Tenta sincronizar treinos enfileirados em segundo plano
        await syncPendingSessionsOffline(finishSessionAction);
      }
    });

    return () => unsubscribe();
  }, []);

  // Carrega estado offline da sessão ativa (IndexedDB com fallback para LocalStorage)
  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        const cached = await loadActiveSessionOffline<RunnerExercise[]>(sessionId);
        if (mounted && cached && Array.isArray(cached) && cached.length === initialExercises.length) {
          setExercises(cached);
        }
      } catch {}
      if (mounted) {
        setHydratedStorage(true);
      }
    }
    restore();
    return () => {
      mounted = false;
    };
  }, [sessionId, initialExercises.length]);

  // Persiste a sessão ativa no IndexedDB a cada alteração de séries/repetições/cargas
  useEffect(() => {
    if (!hydratedStorage) return;
    saveActiveSessionOffline(sessionId, exercises);
  }, [exercises, sessionId, hydratedStorage]);

  useEffect(() => {
    const start = new Date(startedAtIso).getTime();
    const syncElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    syncElapsed();
    const timer = setInterval(syncElapsed, 1000);
    return () => clearInterval(timer);
  }, [startedAtIso]);



  const activeExercise = exercises[activeExerciseIndex] ?? exercises[0];
  const lastSets = activeExercise ? lastPerformanceMap[activeExercise.exerciseId] ?? [] : [];

  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalVolumeKg = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed && s.actualLoadKg > 0 && s.actualReps > 0)
        .reduce((sum, s) => sum + s.actualLoadKg * s.actualReps, 0)
    );
  }, 0);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const updateSet = (
    exerciseIdx: number,
    setIdx: number,
    updater: (prev: RunnerSet) => RunnerSet
  ) => {
    setExercises((current) =>
      current.map((ex, exI) => {
        if (exI !== exerciseIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sI) => {
            if (sI !== setIdx) return s;
            return updater(s);
          }),
        };
      })
    );
  };

  const toggleSetCompleted = (exerciseIdx: number, setIdx: number) => {
    const targetSet = exercises[exerciseIdx]?.sets[setIdx];
    if (!targetSet) return;

    const willComplete = !targetSet.completed;

    updateSet(exerciseIdx, setIdx, (prev) => ({
      ...prev,
      completed: willComplete,
    }));

    if (willComplete) {
      const restSeconds = targetSet.restTakenSeconds ?? 60;
      let nextLabel = "";
      const currentEx = exercises[exerciseIdx];
      if (setIdx + 1 < currentEx.sets.length) {
        const nextSet = currentEx.sets[setIdx + 1];
        nextLabel = `Próxima: Série ${nextSet.setNumber} · ${currentEx.name}`;
      } else if (exerciseIdx + 1 < exercises.length) {
        const nextEx = exercises[exerciseIdx + 1];
        nextLabel = `Próximo: ${nextEx.name} (Série 1)`;
      } else {
        nextLabel = "Último exercício completado!";
      }

      setRestTimer((p) => ({
        key: p.key + 1,
        active: true,
        remaining: restSeconds,
        total: restSeconds,
        nextSetLabel: nextLabel,
      }));
    }
  };

  const handleFinishWorkout = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      sessionId,
      totalDurationSeconds: Math.max(1, elapsedSeconds),
      perceivedExertionRpe: rpe,
      studentFeedback: studentFeedback.trim() || undefined,
      exercises: exercises.map((ex, idx) => ({
        exerciseId: ex.exerciseId,
        workoutExerciseId: ex.workoutExerciseId ?? undefined,
        orderIndex: idx,
        isCompleted: ex.sets.every((s) => s.completed),
        notes: ex.coachNotes ?? undefined,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          prescribedLoadKg:
            s.prescribedLoadKg !== null && s.prescribedLoadKg !== undefined
              ? Number(s.prescribedLoadKg)
              : undefined,
          actualLoadKg: Number(s.actualLoadKg) || 0,
          prescribedReps: s.prescribedReps ?? undefined,
          actualReps: Number(s.actualReps) || 0,
          completed: s.completed,
          restTakenSeconds: s.restTakenSeconds ?? undefined,
          rpe: s.rpe ? Number(s.rpe) : undefined,
        })),
      })),
    };

    const saveOfflineAndNotify = async () => {
      await enqueuePendingSessionOffline(payload);
      await clearActiveSessionOffline(sessionId);
      setIsSubmitting(false);
      setOfflineSavedNotification(true);
      setTimeout(() => {
        router.push("/student/history");
      }, 1600);
    };

    // Se estiver sem conexão no momento, enfileira localmente no aparelho
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveOfflineAndNotify();
      return;
    }

    try {
      const res = await finishSessionAction(payload);
      setIsSubmitting(false);

      if (res.ok) {
        await clearActiveSessionOffline(sessionId);
        setShowFinishModal(false);
        setShowCelebrationDialog(true);
      } else {
        setSubmitError(res.message ?? "Erro ao salvar treino no servidor.");
      }
    } catch {
      // Falha de rede catastrófica (queda de sinal na academia)
      await saveOfflineAndNotify();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Session Control Bar */}
      <div className="sticky top-14 z-30 flex items-center justify-between gap-2 rounded-lg border border-border bg-card/95 px-3.5 py-2.5 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums text-primary">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
          <span className="text-border">|</span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground truncate">
            <strong className="text-foreground">
              {totalVolumeKg.toLocaleString("pt-BR")}
            </strong>{" "}
            kg
          </span>
          {!isOnline && (
            <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
              <WifiOff className="h-3 w-3" /> Offline
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRestTimer((p) => ({
                key: p.key + 1,
                active: true,
                remaining: 60,
                total: 60,
                nextSetLabel: "Descanso manual",
              }));
            }}
            className="h-9 px-2.5 font-mono text-xs text-muted-foreground hover:text-primary hover:border-primary/50"
            aria-label="Iniciar cronômetro de descanso manual"
          >
            <Clock className="h-3.5 w-3.5 mr-1 text-primary" />
            Descanso
          </Button>

          <Badge variant="outline" className="font-mono tabular-nums">
            {completedSetsCount}/{totalSetsCount}
          </Badge>
          <Button
            size="sm"
            onClick={() => setShowFinishModal(true)}
            className="h-9 px-3.5 font-semibold"
          >
            Finalizar
          </Button>
        </div>
      </div>

      {/* High-Impact Rest Chronometer with Circular Ring and Floating Mini-Bar */}
      {restTimer.remaining > 0 && (
        <RestChronometer
          key={restTimer.key}
          initialSeconds={restTimer.remaining}
          autoStart={restTimer.active}
          nextSetLabel={restTimer.nextSetLabel}
          onFinish={() => {
            setRestTimer((p) => ({ ...p, active: false, remaining: 0 }));
          }}
          onCancel={() => {
            setRestTimer((p) => ({ ...p, active: false, remaining: 0 }));
          }}
        />
      )}

      {/* Exercise Switcher Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {exercises.map((ex, idx) => {
          const completed = ex.sets.every((s) => s.completed);
          const active = idx === activeExerciseIndex;
          return (
            <button
              key={ex.exerciseId}
              type="button"
              onClick={() => setActiveExerciseIndex(idx)}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                active
                  ? "border-primary/50 bg-secondary text-foreground"
                  : completed
                  ? "border-emerald-500/30 bg-emerald-500/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="font-mono tabular-nums">{idx + 1}.</span>
              <span className="truncate max-w-[130px]">{ex.name}</span>
              {completed && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Active Exercise Execution Card */}
      {activeExercise && (
        <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="border-b border-border bg-popover/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {activeExercise.mediaUrl && (
                  <ExerciseGuideDialog
                    exercise={{
                      name: activeExercise.name,
                      categoryName: activeExercise.categoryName,
                      primaryMuscleGroup: activeExercise.primaryMuscleGroup,
                      mediaUrl: activeExercise.mediaUrl,
                      coachNotes: activeExercise.coachNotes,
                      instructions: activeExercise.instructions,
                    }}
                    triggerLabel=""
                    triggerVariant="ghost"
                    triggerClassName="p-0 h-auto rounded-lg overflow-hidden shrink-0 group border border-border/80 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg bg-black/40 cursor-pointer">
                      <SafeImage
                        src={activeExercise.mediaUrl}
                        alt={activeExercise.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                        <Play className="h-4 w-4 fill-white text-white drop-shadow" />
                      </div>
                    </div>
                  </ExerciseGuideDialog>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary">
                    {activeExercise.categoryName} · {activeExercise.primaryMuscleGroup}
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold text-foreground tracking-tight">
                    {activeExercise.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="font-mono text-xs tabular-nums font-semibold">
                  {activeExerciseIndex + 1}/{exercises.length}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <ExerciseGuideDialog
                exercise={{
                  name: activeExercise.name,
                  categoryName: activeExercise.categoryName,
                  primaryMuscleGroup: activeExercise.primaryMuscleGroup,
                  mediaUrl: activeExercise.mediaUrl,
                  coachNotes: activeExercise.coachNotes,
                  instructions: activeExercise.instructions,
                }}
                triggerLabel="Ver instruções e vídeo"
                triggerClassName="h-9 px-3 text-xs font-medium"
              />
            </div>

            {activeExercise.coachNotes && (
              <p className="border-l-2 border-primary/60 bg-primary/[0.04] pl-3 py-1.5 pr-2 rounded-r text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">Treinador:</strong>{" "}
                {activeExercise.coachNotes}
              </p>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Sets Table (Responsive for 360px+ without horizontal overflow) */}
            <div>
              <div className="grid grid-cols-[36px_1fr_68px_58px_48px] gap-1.5 sm:gap-2.5 border-b border-border pb-2 text-[11px] font-medium text-muted-foreground">
                <span>Série</span>
                <span>Meta / Ant.</span>
                <span className="text-center">Carga (kg)</span>
                <span className="text-center">Reps</span>
                <span className="text-center">OK</span>
              </div>

              <div className="divide-y divide-border/70">
                {activeExercise.sets.map((set, setIdx) => {
                  const lastSet = lastSets.find((l) => l.setNumber === set.setNumber);

                  return (
                    <div
                      key={set.setNumber}
                      className={cn(
                        "grid grid-cols-[36px_1fr_68px_58px_48px] gap-1.5 sm:gap-2.5 items-center py-2.5 transition-all duration-150 rounded-sm px-1",
                        set.completed
                          ? "bg-emerald-500/[0.08] border-l-2 border-emerald-500"
                          : "hover:bg-secondary/40"
                      )}
                    >
                      <div className="font-mono text-xs font-semibold tabular-nums text-foreground">
                        #{set.setNumber}
                      </div>

                      <div className="min-w-0 text-[11px] leading-tight">
                        <p className="font-mono tabular-nums text-foreground font-medium">
                          {set.prescribedReps ? `${set.prescribedReps} reps` : "—"}
                        </p>
                        {lastSet ? (
                          <p className="truncate font-mono text-[10px] tabular-nums text-primary font-medium">
                            Ant: {lastSet.loadKg}×{lastSet.reps}
                          </p>
                        ) : (
                          <p className="truncate text-[10px] text-brand-textMuted">
                            Sem histórico
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          min={0}
                          aria-label={`Carga da série ${set.setNumber}`}
                          value={set.actualLoadKg === 0 ? "" : set.actualLoadKg}
                          placeholder={
                            set.prescribedLoadKg ? `${set.prescribedLoadKg}` : "0"
                          }
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateSet(activeExerciseIndex, setIdx, (s) => ({
                              ...s,
                              actualLoadKg: val,
                            }));
                          }}
                          className={cn(
                            "h-11 px-1.5 text-center font-mono text-sm font-semibold tabular-nums transition-colors",
                            set.completed && "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                          )}
                        />
                      </div>

                      <div>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          aria-label={`Repetições da série ${set.setNumber}`}
                          value={set.actualReps === 0 ? "" : set.actualReps}
                          placeholder="10"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            updateSet(activeExerciseIndex, setIdx, (s) => ({
                              ...s,
                              actualReps: val,
                            }));
                          }}
                          className={cn(
                            "h-11 px-1.5 text-center font-mono text-sm font-semibold tabular-nums transition-colors",
                            set.completed && "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                          )}
                        />
                      </div>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleSetCompleted(activeExerciseIndex, setIdx)}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-lg border transition-all duration-150 touch-manipulation active:scale-95 shadow-sm",
                            set.completed
                              ? "border-emerald-500 bg-emerald-500 text-black font-bold shadow-emerald-500/20"
                              : "border-border bg-secondary/50 text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
                          )}
                          aria-label={`Marcar série ${set.setNumber} como concluída`}
                          aria-pressed={set.completed}
                        >
                          <CheckCircle2
                            className={cn("h-5 w-5", set.completed ? "stroke-[2.5]" : "")}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ergonomic Exercise Navigation */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="touch"
                disabled={activeExerciseIndex === 0}
                onClick={() =>
                  setActiveExerciseIndex((prev) => Math.max(0, prev - 1))
                }
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              <Button
                size="touch"
                disabled={activeExerciseIndex === exercises.length - 1}
                onClick={() =>
                  setActiveExerciseIndex((prev) =>
                    Math.min(exercises.length - 1, prev + 1)
                  )
                }
                className="w-full"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Accessible Finish Workout Dialog */}
      <Dialog open={showFinishModal} onOpenChange={setShowFinishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar treino: {dayName}</DialogTitle>
            <DialogDescription>
              {dayDescription ? `${dayDescription} · ` : ""}
              Confira o resumo da sessão e registre como foi o treino.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {submitError && (
              <div
                role="alert"
                className="space-y-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300"
              >
                <p>{submitError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const payload = {
                      sessionId,
                      totalDurationSeconds: Math.max(1, elapsedSeconds),
                      perceivedExertionRpe: rpe,
                      studentFeedback: studentFeedback.trim() || undefined,
                      exercises: exercises.map((ex, idx) => ({
                        exerciseId: ex.exerciseId,
                        workoutExerciseId: ex.workoutExerciseId ?? undefined,
                        orderIndex: idx,
                        isCompleted: ex.sets.every((s) => s.completed),
                        notes: ex.coachNotes ?? undefined,
                        sets: ex.sets.map((s) => ({
                          setNumber: s.setNumber,
                          prescribedLoadKg:
                            s.prescribedLoadKg !== null && s.prescribedLoadKg !== undefined
                              ? Number(s.prescribedLoadKg)
                              : undefined,
                          actualLoadKg: Number(s.actualLoadKg) || 0,
                          prescribedReps: s.prescribedReps ?? undefined,
                          actualReps: Number(s.actualReps) || 0,
                          completed: s.completed,
                          restTakenSeconds: s.restTakenSeconds ?? undefined,
                          rpe: s.rpe ? Number(s.rpe) : undefined,
                        })),
                      })),
                    };
                    await enqueuePendingSessionOffline(payload);
                    await clearActiveSessionOffline(sessionId);
                    setShowFinishModal(false);
                    setOfflineSavedNotification(true);
                    setTimeout(() => router.push("/student/history"), 1600);
                  }}
                  className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                >
                  Salvar no aparelho e sincronizar depois
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-background p-3 text-center">
              <div>
                <p className="text-[11px] text-muted-foreground">Tempo</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-primary">
                  {formatTime(elapsedSeconds)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Tonelagem</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {totalVolumeKg.toLocaleString("pt-BR")} kg
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Séries</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {completedSetsCount}/{totalSetsCount}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rpe-slider"
                className="flex items-center justify-between text-xs font-medium text-foreground"
              >
                <span>Percepção de esforço (RPE)</span>
                <span className="font-mono font-semibold tabular-nums text-primary">
                  {rpe} / 10
                </span>
              </label>
              <input
                id="rpe-slider"
                type="range"
                min={1}
                max={10}
                step={1}
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value, 10))}
                className="w-full h-6 accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                {RPE_DESCRIPTIONS[rpe]}
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="feedback"
                className="flex items-center gap-1.5 text-xs font-medium text-foreground"
              >
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Comentário para o treinador (opcional)
              </label>
              <Textarea
                id="feedback"
                rows={3}
                value={studentFeedback}
                onChange={(e) => setStudentFeedback(e.target.value)}
                placeholder="Ex: Progresso de carga no supino, leve fadiga na última série."
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
              <Button
                variant="outline"
                size="touch"
                disabled={isSubmitting}
                onClick={() => setShowFinishModal(false)}
                className="h-11"
              >
                Continuar treinando
              </Button>
              <Button
                size="touch"
                disabled={isSubmitting}
                onClick={handleFinishWorkout}
                className="h-11"
              >
                {isSubmitting ? "Salvando..." : "Concluir e salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard Session */}
      <div className="flex justify-center pt-2">
        <form action={abandonSessionAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-10 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Descartar sessão em andamento
          </Button>
        </form>
      </div>

      {/* Offline Saved Confirmation Dialog */}
      <Dialog open={offlineSavedNotification}>
        <DialogContent className="text-center sm:max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="mt-2 text-base font-semibold">
            Treino Salvo com Sucesso no Aparelho!
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Você está sem conexão no momento. Seu treino foi gravado localmente no celular e será enviado automaticamente para o seu treinador assim que tiver sinal de internet.
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Celebration & Instagram Story Card Dialog */}
      <StoryCardDialog
        isOpen={showCelebrationDialog}
        onOpenChange={(open) => {
          setShowCelebrationDialog(open);
          if (!open) {
            router.push("/student/history");
          }
        }}
        data={{
          workoutName: dayName,
          studentName: studentName || "Aluno",
          dateStr: new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "short",
          }),
          totalVolumeKg,
          durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
          completedSetsCount,
          totalSetsCount,
          rpe,
        }}
      />
    </div>
  );
}
