"use client";

import { useState } from "react";
import { Play, Check, Clock, ChevronRight, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";

export default function StudentTodayPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

  const toggleSet = (setId: string, restSeconds: number) => {
    const isNowDone = !completedSets[setId];
    setCompletedSets((prev) => ({ ...prev, [setId]: isNowDone }));

    if (isNowDone) {
      setRestTimer(restSeconds);
    }
  };

  return (
    <div className="space-y-5">
      {/* Session Header Card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-[#162024] to-[#12161D] p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <Badge variant="emerald" className="text-xs">
            Treino do Dia • Segunda-feira
          </Badge>
          <span className="text-xs text-[#9BA3AF]">60 min est.</span>
        </div>

        <h1 className="mt-2 text-xl font-bold tracking-tight text-[#F3F5F7]">
          Treino A — Peito, Tríceps & Ombros
        </h1>
        <p className="mt-1 text-xs text-[#9BA3AF]">
          Fase 1: Hipertrofia Básica • Prescrito por Lucas Treinador
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[#242C3A]/80 pt-3">
          <div className="flex items-center gap-2 text-xs text-[#9BA3AF]">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>5 exercícios • 16 séries</span>
          </div>

          {!sessionActive ? (
            <Button
              onClick={() => setSessionActive(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-bold h-10 px-5 gap-2"
            >
              <Play className="h-4 w-4 fill-current" />
              Iniciar Treino
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setSessionActive(false)}
              className="h-9 px-4 text-xs font-semibold"
            >
              Finalizar Treino
            </Button>
          )}
        </div>
      </div>

      {/* Floating Rest Timer Widget when active */}
      {restTimer !== null && (
        <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto rounded-xl border border-emerald-500/30 bg-[#12161D]/95 p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono text-base">
              {formatTime(restTimer)}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F3F5F7]">Tempo de Descanso</p>
              <p className="text-[11px] text-[#9BA3AF]">Próxima série em instantes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRestTimer((t) => (t !== null ? t + 30 : 30))}
              className="h-8 px-2 text-xs border-[#242C3A]"
            >
              +30s
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRestTimer(null)}
              className="h-8 px-2 text-xs text-[#9BA3AF] hover:text-[#F3F5F7]"
            >
              Pular
            </Button>
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        {[
          {
            id: "ex-1",
            name: "Supino Reto com Barra",
            muscle: "Peitoral Maior",
            sets: [
              { id: "s1-1", num: 1, targetReps: "10-12", targetLoad: "60 kg", lastSession: "55 kg x 10" },
              { id: "s1-2", num: 2, targetReps: "10-12", targetLoad: "60 kg", lastSession: "60 kg x 10" },
              { id: "s1-3", num: 3, targetReps: "8-10", targetLoad: "65 kg", lastSession: "60 kg x 8" },
            ],
            notes: "Manter escápulas aduzidas e descer até a linha do esterno.",
          },
          {
            id: "ex-2",
            name: "Supino Inclinado com Halteres",
            muscle: "Peitoral Superior",
            sets: [
              { id: "s2-1", num: 1, targetReps: "10-12", targetLoad: "22 kg", lastSession: "20 kg x 12" },
              { id: "s2-2", num: 2, targetReps: "10-12", targetLoad: "22 kg", lastSession: "22 kg x 10" },
              { id: "s2-3", num: 3, targetReps: "10", targetLoad: "24 kg", lastSession: "22 kg x 10" },
            ],
            notes: "Banco inclinado a 30 graus. Controle na fase excêntrica.",
          },
          {
            id: "ex-3",
            name: "Tríceps Corda no Crossover",
            muscle: "Tríceps Braquial",
            sets: [
              { id: "s3-1", num: 1, targetReps: "12-15", targetLoad: "25 kg", lastSession: "20 kg x 15" },
              { id: "s3-2", num: 2, targetReps: "12-15", targetLoad: "25 kg", lastSession: "25 kg x 12" },
              { id: "s3-3", num: 3, targetReps: "12", targetLoad: "25 kg", lastSession: "25 kg x 12" },
            ],
            notes: "Abrir a corda no final do movimento e manter cotovelos travados.",
          },
        ].map((exercise, exIndex) => (
          <Card key={exercise.id} className="border-[#242C3A] bg-[#12161D] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#242C3A]/60 p-3.5 bg-[#161B24]">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  {exIndex + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-sm text-[#F3F5F7]">{exercise.name}</h3>
                  <p className="text-[11px] text-[#9BA3AF]">{exercise.muscle}</p>
                </div>
              </div>

              <button className="flex h-8 w-8 items-center justify-center rounded-md border border-[#242C3A] text-[#9BA3AF] hover:text-[#F3F5F7]">
                <Info className="h-4 w-4" />
              </button>
            </div>

            <CardContent className="p-3.5 space-y-2.5">
              {exercise.notes && (
                <p className="text-xs text-[#9BA3AF] italic bg-[#090B0E]/60 p-2 rounded border border-[#242C3A]/40">
                  {exercise.notes}
                </p>
              )}

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[11px] font-semibold text-[#647082] px-2 uppercase tracking-wider">
                  <span className="col-span-2">Série</span>
                  <span className="col-span-3">Prescrito</span>
                  <span className="col-span-4">Carga Real</span>
                  <span className="col-span-3 text-right">Check</span>
                </div>

                {exercise.sets.map((set) => {
                  const isDone = completedSets[set.id] || false;
                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 items-center rounded-lg border p-2 text-xs transition-colors ${
                        isDone
                          ? "border-emerald-500/30 bg-emerald-500/10 text-[#F3F5F7]"
                          : "border-[#242C3A]/60 bg-[#090B0E]/60 text-[#9BA3AF]"
                      }`}
                    >
                      <span className="col-span-2 font-mono font-bold text-sm text-[#F3F5F7]">
                        #{set.num}
                      </span>

                      <div className="col-span-3">
                        <span className="font-medium text-[#F3F5F7]">{set.targetLoad}</span>
                        <p className="text-[10px] text-[#647082]">{set.targetReps} reps</p>
                      </div>

                      <div className="col-span-4 flex items-center gap-1">
                        <input
                          type="text"
                          defaultValue={set.targetLoad.replace(" kg", "")}
                          className="h-8 w-14 rounded border border-[#242C3A] bg-[#12161D] text-center font-bold text-sm text-[#F3F5F7] focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[11px] text-[#647082]">kg</span>
                      </div>

                      <div className="col-span-3 flex justify-end">
                        <button
                          onClick={() => toggleSet(set.id, 60)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95 ${
                            isDone
                              ? "bg-emerald-500 border-emerald-400 text-[#090B0E]"
                              : "border-[#242C3A] bg-[#12161D] text-[#9BA3AF] hover:border-emerald-500/50"
                          }`}
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
