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
  Minus,
  Pause,
  Play,
  Plus,
  SkipForward,
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
import { Textarea } from "@/components/ui/textarea";
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

function playAudioChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export function WorkoutRunner({
  sessionId,
  dayName,
  dayDescription,
  startedAtIso,
  initialExercises,
  lastPerformanceMap,
}: {
  sessionId: string;
  dayName: string;
  dayDescription?: string | null;
  startedAtIso: string;
  initialExercises: RunnerExercise[];
  lastPerformanceMap: Record<string, LastPerformanceSet[]>;
}) {
  const router = useRouter();
  const storageKey = `fitflow_session_${sessionId}`;

  const [exercises, setExercises] = useState<RunnerExercise[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length === initialExercises.length) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialExercises;
  });

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const start = new Date(startedAtIso).getTime();
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  });

  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    remaining: number;
    total: number;
  }>({
    active: false,
    remaining: 0,
    total: 60,
  });

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpe, setRpe] = useState<number>(8);
  const [studentFeedback, setStudentFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(exercises));
    } catch {}
  }, [exercises, storageKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!restTimer.active || restTimer.remaining <= 0) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev.remaining <= 1) {
          playAudioChime();
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch {}
          }
          return { ...prev, active: false, remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.remaining]);

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
      setRestTimer({
        active: true,
        remaining: restSeconds,
        total: restSeconds,
      });
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

    const res = await finishSessionAction(payload);
    setIsSubmitting(false);

    if (res.ok) {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      router.push("/student/history");
    } else {
      setSubmitError(res.message ?? "Erro ao salvar treino no servidor.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Session Control Bar */}
      <div className="sticky top-14 z-30 flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="font-mono tabular-nums">
            {completedSetsCount}/{totalSetsCount}
          </Badge>
          <Button
            size="sm"
            onClick={() => setShowFinishModal(true)}
            className="h-10 px-3.5"
          >
            Finalizar
          </Button>
        </div>
      </div>

      {/* Rest Timer Panel (Ergonomic >= 44px touch targets) */}
      {restTimer.remaining > 0 && (
        <section
          aria-label="Cronômetro de descanso"
          className="rounded-lg border border-primary/40 bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Descanso entre séries
            </span>
            <span className="font-mono text-2xl font-bold tabular-nums text-primary">
              {formatTime(restTimer.remaining)}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-secondary">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (restTimer.remaining / (restTimer.total || 60)) * 100)
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-11 min-w-[64px] font-mono text-xs"
                onClick={() =>
                  setRestTimer((p) => ({
                    ...p,
                    remaining: Math.max(0, p.remaining - 15),
                  }))
                }
              >
                <Minus className="h-3.5 w-3.5" />
                15s
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-11 min-w-[64px] font-mono text-xs"
                onClick={() =>
                  setRestTimer((p) => ({
                    ...p,
                    remaining: p.remaining + 30,
                    total: Math.max(p.total, p.remaining + 30),
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" />
                30s
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                aria-label={restTimer.active ? "Pausar descanso" : "Retomar descanso"}
                onClick={() =>
                  setRestTimer((p) => ({ ...p, active: !p.active }))
                }
              >
                {restTimer.active ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 px-3 text-xs"
                onClick={() =>
                  setRestTimer({ active: false, remaining: 0, total: 60 })
                }
              >
                <SkipForward className="h-4 w-4" />
                Pular
              </Button>
            </div>
          </div>
        </section>
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
        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-popover/50 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary">
                  {activeExercise.categoryName} · {activeExercise.primaryMuscleGroup}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-foreground">
                  {activeExercise.name}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="font-mono tabular-nums">
                  {activeExerciseIndex + 1}/{exercises.length}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <ExerciseGuideDialog
                exercise={{
                  name: activeExercise.name,
                  categoryName: activeExercise.categoryName,
                  primaryMuscleGroup: activeExercise.primaryMuscleGroup,
                  mediaUrl: activeExercise.mediaUrl,
                  coachNotes: activeExercise.coachNotes,
                  instructions: activeExercise.instructions,
                }}
                triggerLabel="Instruções e vídeo"
                triggerClassName="h-10 px-3 text-xs"
              />
            </div>

            {activeExercise.coachNotes && (
              <p className="border-l-2 border-primary/50 pl-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Treinador:</strong>{" "}
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
                      className={`grid grid-cols-[36px_1fr_68px_58px_48px] gap-1.5 sm:gap-2.5 items-center py-2.5 transition-colors duration-150 ${
                        set.completed ? "bg-emerald-500/[0.04]" : ""
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold tabular-nums text-foreground">
                        #{set.setNumber}
                      </div>

                      <div className="min-w-0 text-[11px] leading-tight">
                        <p className="font-mono tabular-nums text-foreground">
                          {set.prescribedReps ? `${set.prescribedReps} reps` : "—"}
                        </p>
                        {lastSet ? (
                          <p className="truncate font-mono text-[10px] tabular-nums text-primary">
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
                          className="h-11 px-1.5 text-center font-mono text-sm font-semibold tabular-nums"
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
                          className="h-11 px-1.5 text-center font-mono text-sm font-semibold tabular-nums"
                        />
                      </div>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleSetCompleted(activeExerciseIndex, setIdx)}
                          className={`flex h-11 w-11 items-center justify-center rounded-md border transition-colors duration-150 ${
                            set.completed
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-brand-borderStrong hover:text-foreground"
                          }`}
                          aria-label={`Marcar série ${set.setNumber} como concluída`}
                          aria-pressed={set.completed}
                        >
                          <CheckCircle2
                            className={`h-5 w-5 ${set.completed ? "stroke-[2.5]" : ""}`}
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
                className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300"
              >
                {submitError}
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
    </div>
  );
}
