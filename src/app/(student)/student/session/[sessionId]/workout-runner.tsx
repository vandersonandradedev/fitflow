"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flame,
  MessageSquare,
  Minus,
  Pause,
  Play,
  Plus,
  SkipForward,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  // LocalStorage state recovery
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

  // Rest Timer State
  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    remaining: number;
    total: number;
  }>({
    active: false,
    remaining: 0,
    total: 60,
  });

  // Finish modal state
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rpe, setRpe] = useState<number>(8);
  const [studentFeedback, setStudentFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(exercises));
    } catch {}
  }, [exercises, storageKey]);

  // Session elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest countdown interval
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

  // Metrics
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
      // Auto-start rest timer
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
      {/* Top Floating Runner Bar: Elapsed Time & Live Tonnage */}
      <div className="sticky top-14 z-30 flex items-center justify-between rounded-xl border border-[#242C3A] bg-[#12161D]/95 p-3 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
            <Clock className="h-4 w-4" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#9BA3AF]">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>
              <strong className="text-[#F3F5F7]">
                {totalVolumeKg.toLocaleString("pt-BR")}
              </strong>{" "}
              kg
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-medium">
            {completedSetsCount} / {totalSetsCount} séries
          </Badge>
          <Button
            size="sm"
            onClick={() => setShowFinishModal(true)}
            className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
          >
            Finalizar
          </Button>
        </div>
      </div>

      {/* Rest Timer Banner (Floats when active or paused) */}
      {restTimer.remaining > 0 && (
        <div className="rounded-xl border border-emerald-500/40 bg-[#090B0E] p-3 text-xs shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 animate-pulse text-emerald-400" />
              Cronômetro de Descanso
            </span>
            <span className="font-mono text-base font-bold text-emerald-400">
              {formatTime(restTimer.remaining)}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1D2430]">
            <div
              className="h-full bg-emerald-400 transition-all duration-1000"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (restTimer.remaining / (restTimer.total || 60)) * 100)
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-1 pt-1">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 border-[#242C3A] text-[11px]"
                onClick={() =>
                  setRestTimer((p) => ({
                    ...p,
                    remaining: Math.max(0, p.remaining - 15),
                  }))
                }
              >
                <Minus className="h-3 w-3 mr-0.5" /> 15s
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 border-[#242C3A] text-[11px]"
                onClick={() =>
                  setRestTimer((p) => ({
                    ...p,
                    remaining: p.remaining + 30,
                    total: Math.max(p.total, p.remaining + 30),
                  }))
                }
              >
                <Plus className="h-3 w-3 mr-0.5" /> 30s
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 border-[#242C3A] text-[11px]"
                onClick={() =>
                  setRestTimer((p) => ({ ...p, active: !p.active }))
                }
              >
                {restTimer.active ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[#9BA3AF] hover:text-[#F3F5F7] text-[11px]"
                onClick={() =>
                  setRestTimer({ active: false, remaining: 0, total: 60 })
                }
              >
                <SkipForward className="h-3 w-3 mr-1" /> Pular
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exercises Horizontal Navigation Tabs (Pills) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {exercises.map((ex, idx) => {
          const completed = ex.sets.every((s) => s.completed);
          const active = idx === activeExerciseIndex;
          return (
            <button
              key={ex.exerciseId}
              onClick={() => setActiveExerciseIndex(idx)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : completed
                  ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border border-[#242C3A] bg-[#12161D] text-[#9BA3AF] hover:text-[#F3F5F7]"
              }`}
            >
              <span>{idx + 1}.</span>
              <span className="truncate max-w-[120px]">{ex.name}</span>
              {completed && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Active Exercise Detail Card */}
      {activeExercise && (
        <Card className="border-[#242C3A] bg-[#12161D] overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-[#242C3A]/60 bg-[#161B24]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {activeExercise.categoryName} • {activeExercise.primaryMuscleGroup}
                </span>
                <h2 className="text-base font-bold text-[#F3F5F7] mt-0.5">
                  {activeExercise.name}
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Exercício {activeExerciseIndex + 1} de {exercises.length}
              </Badge>
            </div>

            {activeExercise.coachNotes && (
              <p className="mt-2 text-xs italic text-[#9BA3AF] bg-[#090B0E]/60 p-2 rounded border border-[#242C3A]/40">
                <strong className="text-[#F3F5F7]">Treinador:</strong>{" "}
                {activeExercise.coachNotes}
              </p>
            )}
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Media Illustration / Demo preview if local SVG */}
            {activeExercise.mediaUrl && activeExercise.mediaUrl.startsWith("/images/") && (
              <div className="overflow-hidden rounded-lg border border-[#242C3A] bg-[#090B0E]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeExercise.mediaUrl}
                  alt={activeExercise.name}
                  className="h-28 w-full object-cover opacity-90"
                />
              </div>
            )}

            {/* Sets Execution Table */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase text-[#647082] px-1">
                <span className="col-span-2">Série</span>
                <span className="col-span-3">Meta / Anterior</span>
                <span className="col-span-3">Carga (kg)</span>
                <span className="col-span-2">Reps</span>
                <span className="col-span-2 text-center">OK</span>
              </div>

              {activeExercise.sets.map((set, setIdx) => {
                const lastSet = lastSets.find((l) => l.setNumber === set.setNumber);

                return (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-12 gap-2 items-center rounded-xl border p-2.5 transition-colors ${
                      set.completed
                        ? "border-emerald-500/40 bg-emerald-500/5 text-[#F3F5F7]"
                        : "border-[#242C3A] bg-[#090B0E]/60 text-[#9BA3AF]"
                    }`}
                  >
                    {/* Set Number */}
                    <div className="col-span-2 font-mono font-bold text-xs text-[#F3F5F7]">
                      #{set.setNumber}
                    </div>

                    {/* Prescribed and Previous Performance */}
                    <div className="col-span-3 text-[11px] leading-tight">
                      <p className="text-[#F3F5F7]">
                        {set.prescribedReps ? `${set.prescribedReps} reps` : "—"}
                      </p>
                      {lastSet ? (
                        <p className="text-[10px] text-emerald-400 font-medium">
                          Ant: {lastSet.loadKg}kg x {lastSet.reps}
                        </p>
                      ) : (
                        <p className="text-[10px] text-[#647082]">Sem histórico</p>
                      )}
                    </div>

                    {/* Actual Load Input */}
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.5"
                        min={0}
                        value={set.actualLoadKg === 0 ? "" : set.actualLoadKg}
                        placeholder={
                          set.prescribedLoadKg
                            ? `${set.prescribedLoadKg}`
                            : "0"
                        }
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateSet(activeExerciseIndex, setIdx, (s) => ({
                            ...s,
                            actualLoadKg: val,
                          }));
                        }}
                        className="h-10 text-center font-bold text-sm bg-[#12161D] border-[#242C3A]"
                      />
                    </div>

                    {/* Actual Reps Input */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        value={set.actualReps === 0 ? "" : set.actualReps}
                        placeholder="10"
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          updateSet(activeExerciseIndex, setIdx, (s) => ({
                            ...s,
                            actualReps: val,
                          }));
                        }}
                        className="h-10 text-center font-bold text-sm bg-[#12161D] border-[#242C3A]"
                      />
                    </div>

                    {/* Checkbox Trigger (Min 48px touch target) */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleSetCompleted(activeExerciseIndex, setIdx)
                        }
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                          set.completed
                            ? "border-emerald-500 bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                            : "border-[#242C3A] bg-[#12161D] text-[#647082] hover:border-emerald-500/40"
                        }`}
                        aria-label={`Marcar série ${set.setNumber} como concluída`}
                      >
                        <CheckCircle2
                          className={`h-5 w-5 ${
                            set.completed ? "stroke-[2.5]" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation between exercises */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeExerciseIndex === 0}
                onClick={() =>
                  setActiveExerciseIndex((prev) => Math.max(0, prev - 1))
                }
                className="border-[#242C3A] text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Exercício Anterior
              </Button>

              <Button
                size="sm"
                disabled={activeExerciseIndex === exercises.length - 1}
                onClick={() =>
                  setActiveExerciseIndex((prev) =>
                    Math.min(exercises.length - 1, prev + 1)
                  )
                }
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
              >
                Próximo Exercício
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finish Workout Modal / Bottom Sheet */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-[#242C3A] bg-[#12161D] shadow-2xl space-y-4">
            <CardHeader className="pb-2 border-b border-[#242C3A]/60">
              <CardTitle className="text-base font-bold text-[#F3F5F7] flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-400" />
                Finalizar Treino: {dayName}
              </CardTitle>
              {dayDescription && (
                <p className="text-xs text-emerald-400/80">{dayDescription}</p>
              )}
              <p className="text-xs text-[#9BA3AF]">
                Confira o resumo da sua sessão e envie seu feedback para o treinador.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {submitError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  {submitError}
                </div>
              )}

              {/* Workout Session Stats */}
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#242C3A] bg-[#090B0E] p-3 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#647082]">
                    Tempo Total
                  </p>
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#647082]">
                    Tonelagem
                  </p>
                  <p className="text-sm font-bold text-[#F3F5F7]">
                    {totalVolumeKg.toLocaleString("pt-BR")} kg
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#647082]">
                    Séries
                  </p>
                  <p className="text-sm font-bold text-[#F3F5F7]">
                    {completedSetsCount} / {totalSetsCount}
                  </p>
                </div>
              </div>

              {/* Perceived Exertion (RPE 1-10) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#F3F5F7] flex items-center justify-between">
                  <span>Percepção Subjetiva de Esforço (RPE):</span>
                  <span className="font-bold text-emerald-400">{rpe} / 10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={rpe}
                  onChange={(e) => setRpe(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-[11px] text-[#9BA3AF]">
                  {RPE_DESCRIPTIONS[rpe]}
                </p>
              </div>

              {/* Student Feedback for Trainer */}
              <div className="space-y-1.5">
                <label
                  htmlFor="feedback"
                  className="text-xs font-semibold text-[#F3F5F7] flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  Comentário para seu Personal Trainer (opcional)
                </label>
                <textarea
                  id="feedback"
                  rows={3}
                  value={studentFeedback}
                  onChange={(e) => setStudentFeedback(e.target.value)}
                  placeholder="Ex: Treino muito bom! Consegui progredir 2kg no supino, mas senti leve cansaço na lombar no final."
                  className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] p-2.5 text-xs text-[#F3F5F7]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242C3A]/60">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setShowFinishModal(false)}
                  className="border-[#242C3A] text-xs"
                >
                  Continuar Treinando
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleFinishWorkout}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs"
                >
                  {isSubmitting ? "Salvando Treino..." : "Concluir e Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Discard Session Button at bottom */}
      <div className="flex justify-center pt-4">
        <form action={abandonSessionAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Descartar Sessão em Andamento
          </Button>
        </form>
      </div>
    </div>
  );
}
