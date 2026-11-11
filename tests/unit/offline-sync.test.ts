import { describe, expect, it, beforeEach } from "vitest";
import {
  clearActiveSessionOffline,
  enqueuePendingSessionOffline,
  getPendingSessionsOffline,
  loadActiveSessionOffline,
  removePendingSessionOffline,
  saveActiveSessionOffline,
  syncPendingSessionsOffline,
} from "@/lib/offline-sync";
import { FinishSessionInput } from "@/modules/sessions/types";

describe("Modo Offline & Sincronização Resiliente", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persiste e restaura o estado da sessão ativa localmente", async () => {
    const sessionId = "session-123";
    const dummyExercises = [
      {
        exerciseId: "ex-1",
        name: "Supino Reto",
        primaryMuscleGroup: "CHEST",
        categoryName: "Peito",
        instructions: [],
        sets: [
          { setNumber: 1, actualLoadKg: 80, actualReps: 10, completed: true },
        ],
      },
    ];

    await saveActiveSessionOffline(sessionId, dummyExercises);

    const restored = await loadActiveSessionOffline<typeof dummyExercises>(sessionId);
    expect(restored).toEqual(dummyExercises);

    await clearActiveSessionOffline(sessionId);
    const afterClear = await loadActiveSessionOffline(sessionId);
    expect(afterClear).toBeNull();
  });

  it("enfileira treino finalizado offline e gerencia a fila de envio", async () => {
    const payload: FinishSessionInput = {
      sessionId: "11111111-1111-4111-8111-111111111111",
      totalDurationSeconds: 2400,
      perceivedExertionRpe: 8,
      studentFeedback: "Treino ótimo sem internet na academia",
      exercises: [
        {
          exerciseId: "22222222-2222-4222-8222-222222222222",
          orderIndex: 0,
          isCompleted: true,
          sets: [{ setNumber: 1, actualLoadKg: 100, actualReps: 8, completed: true }],
        },
      ],
    };

    await enqueuePendingSessionOffline(payload);

    const queue = await getPendingSessionsOffline();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(payload.sessionId);
    expect(queue[0].payload.perceivedExertionRpe).toBe(8);

    await removePendingSessionOffline(payload.sessionId);
    const queueAfter = await getPendingSessionsOffline();
    expect(queueAfter.length).toBe(0);
  });

  it("sincroniza a fila de treinos offline e descarrega itens enviados com sucesso", async () => {
    const payload: FinishSessionInput = {
      sessionId: "33333333-3333-4333-8333-333333333333",
      totalDurationSeconds: 1800,
      perceivedExertionRpe: 7,
      exercises: [
        {
          exerciseId: "44444444-4444-4444-8444-444444444444",
          orderIndex: 0,
          isCompleted: true,
          sets: [{ setNumber: 1, actualLoadKg: 60, actualReps: 12, completed: true }],
        },
      ],
    };

    await enqueuePendingSessionOffline(payload);

    // Mock da função de sincronização remota
    const mockSync = async (item: FinishSessionInput) => {
      expect(item.sessionId).toBe(payload.sessionId);
      return { ok: true };
    };

    const { syncedCount, failedCount } = await syncPendingSessionsOffline(mockSync);
    expect(syncedCount).toBe(1);
    expect(failedCount).toBe(0);

    const remaining = await getPendingSessionsOffline();
    expect(remaining.length).toBe(0);
  });
});
