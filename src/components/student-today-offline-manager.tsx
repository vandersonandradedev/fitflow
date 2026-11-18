"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Play, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cacheTodayWorkoutOffline,
  clearActiveSessionOffline,
  getActiveOfflineSessionId,
  saveActiveSessionOffline,
  subscribeNetworkStatus,
} from "@/lib/offline-sync";
import { WorkoutRunner, RunnerExercise } from "@/app/(student)/student/session/[sessionId]/workout-runner";
import { startSessionAction } from "@/app/(student)/student/session/actions";

interface StudentTodayOfflineManagerProps {
  trainingDayId: string;
  dayName: string;
  dayDescription?: string | null;
  programTitle: string;
  programGoal?: string | null;
  versionNumber: number;
  exercises: RunnerExercise[];
  inProgressSessionId?: string | null;
  studentName?: string | null;
  coachName?: string | null;
  tenantName?: string | null;
}

export function StudentTodayOfflineManager({
  trainingDayId,
  dayName,
  dayDescription,
  programTitle,
  programGoal,
  versionNumber,
  exercises,
  inProgressSessionId,
  studentName,
  coachName,
  tenantName,
}: StudentTodayOfflineManagerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [activeOfflineSessionId, setActiveOfflineSessionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 1. Cacheia proativamente o treino de hoje no IndexedDB para acesso offline imediato
  useEffect(() => {
    cacheTodayWorkoutOffline({
      trainingDayId,
      dayName,
      dayDescription,
      programTitle,
      programGoal,
      versionNumber,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        workoutExerciseId: ex.workoutExerciseId,
        name: ex.name,
        primaryMuscleGroup: ex.primaryMuscleGroup,
        categoryName: ex.categoryName,
        mediaUrl: ex.mediaUrl,
        coachNotes: ex.coachNotes,
        instructions: ex.instructions,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          repsTarget: s.prescribedReps || "10",
          suggestedLoadKg: s.prescribedLoadKg,
          restSeconds: 60,
        })),
      })),
      updatedAt: new Date().toISOString(),
    });
  }, [trainingDayId, dayName, dayDescription, programTitle, programGoal, versionNumber, exercises]);

  // 2. Monitora rede e restaura sessão offline ativa se existir
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const currentOfflineId = getActiveOfflineSessionId();
    if (currentOfflineId && currentOfflineId.startsWith("offline_")) {
      setActiveOfflineSessionId(currentOfflineId);
    }

    return subscribeNetworkStatus((online) => {
      setIsOnline(online);
    });
  }, []);

  // Inicia sessão no modo offline direto na tela
  const startOfflineSession = () => {
    const offlineId = `offline_${crypto.randomUUID()}`;
    saveActiveSessionOffline(offlineId, exercises);
    setActiveOfflineSessionId(offlineId);
  };

  const handleStartWorkout = () => {
    if (!navigator.onLine) {
      startOfflineSession();
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("trainingDayId", trainingDayId);
        await startSessionAction(formData);
      } catch {
        // Fallback imediato se a conexão falhar durante o envio
        startOfflineSession();
      }
    });
  };

  // Se uma sessão offline estiver em andamento, exibe o WorkoutRunner em tela
  if (activeOfflineSessionId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <span className="flex items-center gap-1.5 font-medium">
            <WifiOff className="h-3.5 w-3.5 text-amber-400" />
            Executando Treino em Modo Offline
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              await clearActiveSessionOffline(activeOfflineSessionId);
              setActiveOfflineSessionId(null);
            }}
            className="h-6 text-[10px] text-muted-foreground hover:text-red-400"
          >
            Descartar Sessão
          </Button>
        </div>

        <WorkoutRunner
          sessionId={activeOfflineSessionId}
          trainingDayId={trainingDayId}
          dayName={dayName}
          dayDescription={dayDescription}
          startedAtIso={new Date().toISOString()}
          initialExercises={exercises}
          studentName={studentName ?? "Aluno"}
          tenantName={tenantName}
          coachName={coachName}
          onFinishOffline={() => {
            setActiveOfflineSessionId(null);
          }}
        />
      </div>
    );
  }

  // Se há sessão online em andamento
  if (inProgressSessionId) {
    return (
      <Link href={`/student/session/${inProgressSessionId}`} className="block">
        <Button size="touch" className="w-full">
          <Play className="h-4 w-4 fill-current" />
          Continuar treino em andamento
        </Button>
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="touch"
        onClick={handleStartWorkout}
        disabled={isPending}
        className="w-full gap-2 shadow-lg active:scale-[0.99] transition-transform"
      >
        <Play className="h-4 w-4 fill-current" />
        {isPending
          ? "Preparando treino..."
          : !isOnline
          ? "Iniciar treino offline agora"
          : "Iniciar treino agora"}
      </Button>

      {!isOnline && (
        <p className="flex items-center justify-center gap-1 text-[11px] text-amber-400/90 font-medium">
          <WifiOff className="h-3 w-3" />
          Sem conexão. O treino será salvo localmente e sincronizado depois.
        </p>
      )}
    </div>
  );
}
