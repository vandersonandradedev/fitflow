/**
 * Módulo de Gerenciamento Offline e Sincronização Resiliente (IndexedDB + Queue)
 *
 * Garante que os treinos possam ser iniciados, executados e finalizados
 * em ambientes sem conexão (academias no subsolo, falha de 4G/Wi-Fi),
 * persistindo os dados localmente e sincronizando automaticamente assim
 * que a rede for restabelecida.
 */

import { FinishSessionInput } from "@/modules/sessions/types";

const DB_NAME = "fitflow_offline_v2";
const STORE_ACTIVE = "active_sessions";
const STORE_QUEUE = "pending_finish_queue";
const STORE_WORKOUT_CACHE = "today_workout_cache";

export interface QueuedFinishSession {
  id: string; // sessionId
  payload: FinishSessionInput;
  queuedAt: string;
  retryCount: number;
}

export interface CachedWorkoutSet {
  id?: string;
  setNumber: number;
  repsTarget: string;
  suggestedLoadKg?: number | null;
  restSeconds: number;
}

export interface CachedWorkoutExercise {
  id?: string;
  exerciseId: string;
  workoutExerciseId?: string | null;
  name: string;
  primaryMuscleGroup: string;
  categoryName: string;
  mediaUrl?: string | null;
  coachNotes?: string | null;
  instructions: Array<{ stepNumber: number; instruction: string; safetyTip?: string | null }>;
  sets: CachedWorkoutSet[];
}

export interface CachedTodayWorkout {
  trainingDayId: string;
  dayName: string;
  dayDescription?: string | null;
  programTitle: string;
  programGoal?: string | null;
  versionNumber: number;
  exercises: CachedWorkoutExercise[];
  updatedAt: string;
}

/**
 * Abre o banco IndexedDB de forma segura com suporte a migrações e fallback.
 */
function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 2);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
          db.createObjectStore(STORE_ACTIVE, { keyPath: "sessionId" });
        }
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_WORKOUT_CACHE)) {
          db.createObjectStore(STORE_WORKOUT_CACHE, { keyPath: "trainingDayId" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Armazena a rotina do treino de hoje no cache local para uso offline.
 */
export async function cacheTodayWorkoutOffline(workout: CachedTodayWorkout): Promise<void> {
  try {
    localStorage.setItem("fitflow_cached_today_workout", JSON.stringify(workout));
  } catch {}

  const db = await openIndexedDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_WORKOUT_CACHE, "readwrite");
    const store = tx.objectStore(STORE_WORKOUT_CACHE);
    store.put(workout);
  } catch {}
}

/**
 * Recupera o treino de hoje em cache quando o dispositivo estiver offline.
 */
export async function getCachedTodayWorkoutOffline(
  trainingDayId?: string
): Promise<CachedTodayWorkout | null> {
  const db = await openIndexedDB();
  if (db) {
    try {
      const result = await new Promise<CachedTodayWorkout | undefined>((resolve) => {
        const tx = db.transaction(STORE_WORKOUT_CACHE, "readonly");
        const store = tx.objectStore(STORE_WORKOUT_CACHE);
        if (trainingDayId) {
          const req = store.get(trainingDayId);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        } else {
          const req = store.getAll();
          req.onsuccess = () => {
            const list = req.result as CachedTodayWorkout[];
            resolve(list && list.length > 0 ? list[list.length - 1] : undefined);
          };
          req.onerror = () => resolve(undefined);
        }
      });

      if (result) return result;
    } catch {}
  }

  // Fallback LocalStorage
  try {
    const cached = localStorage.getItem("fitflow_cached_today_workout");
    if (cached) {
      return JSON.parse(cached) as CachedTodayWorkout;
    }
  } catch {}

  return null;
}

/**
 * Salva o estado em tempo real da sessão em andamento.
 */
export async function saveActiveSessionOffline(
  sessionId: string,
  exercises: unknown
): Promise<void> {
  try {
    localStorage.setItem(`fitflow_session_${sessionId}`, JSON.stringify(exercises));
    localStorage.setItem("fitflow_last_active_session_id", sessionId);
  } catch {}

  const db = await openIndexedDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_ACTIVE, "readwrite");
    const store = tx.objectStore(STORE_ACTIVE);
    store.put({
      sessionId,
      exercises,
      updatedAt: new Date().toISOString(),
    });
  } catch {}
}

/**
 * Carrega o estado em tempo real da sessão em andamento.
 */
export async function loadActiveSessionOffline<T>(sessionId: string): Promise<T | null> {
  const db = await openIndexedDB();
  if (db) {
    try {
      const result = await new Promise<{ exercises: T } | undefined>((resolve) => {
        const tx = db.transaction(STORE_ACTIVE, "readonly");
        const store = tx.objectStore(STORE_ACTIVE);
        const req = store.get(sessionId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      });

      if (result && result.exercises) {
        return result.exercises;
      }
    } catch {}
  }

  // Fallback localStorage
  try {
    const cached = localStorage.getItem(`fitflow_session_${sessionId}`);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {}

  return null;
}

/**
 * Retorna o ID da sessão ativa em andamento (se houver).
 */
export function getActiveOfflineSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fitflow_last_active_session_id");
}

/**
 * Limpa a sessão em andamento após finalização ou descarte.
 */
export async function clearActiveSessionOffline(sessionId: string): Promise<void> {
  try {
    localStorage.removeItem(`fitflow_session_${sessionId}`);
    const lastActive = localStorage.getItem("fitflow_last_active_session_id");
    if (lastActive === sessionId) {
      localStorage.removeItem("fitflow_last_active_session_id");
    }
  } catch {}

  const db = await openIndexedDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_ACTIVE, "readwrite");
    const store = tx.objectStore(STORE_ACTIVE);
    store.delete(sessionId);
  } catch {}
}

/**
 * Enfileira um treino finalizado offline para envio posterior.
 */
export async function enqueuePendingSessionOffline(payload: FinishSessionInput): Promise<void> {
  const item: QueuedFinishSession = {
    id: payload.sessionId,
    payload,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };

  // Fallback LocalStorage
  try {
    const queueKey = "fitflow_offline_queue";
    const existing = JSON.parse(localStorage.getItem(queueKey) || "[]") as QueuedFinishSession[];
    const filtered = existing.filter((q) => q.id !== item.id);
    filtered.push(item);
    localStorage.setItem(queueKey, JSON.stringify(filtered));
  } catch {}

  const db = await openIndexedDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_QUEUE);
    store.put(item);
  } catch {}
}

/**
 * Retorna todos os treinos finalizados pendentes de sincronização.
 */
export async function getPendingSessionsOffline(): Promise<QueuedFinishSession[]> {
  const db = await openIndexedDB();
  if (db) {
    try {
      const items = await new Promise<QueuedFinishSession[]>((resolve) => {
        const tx = db.transaction(STORE_QUEUE, "readonly");
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (items.length > 0) return items;
    } catch {}
  }

  // Fallback LocalStorage
  try {
    const queueKey = "fitflow_offline_queue";
    return JSON.parse(localStorage.getItem(queueKey) || "[]") as QueuedFinishSession[];
  } catch {
    return [];
  }
}

/**
 * Remove um item sincronizado com sucesso da fila.
 */
export async function removePendingSessionOffline(sessionId: string): Promise<void> {
  try {
    const queueKey = "fitflow_offline_queue";
    const existing = JSON.parse(localStorage.getItem(queueKey) || "[]") as QueuedFinishSession[];
    const filtered = existing.filter((q) => q.id !== sessionId);
    localStorage.setItem(queueKey, JSON.stringify(filtered));
  } catch {}

  const db = await openIndexedDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_QUEUE);
    store.delete(sessionId);
  } catch {}
}

/**
 * Executa o descarregamento da fila de treinos offline enviando-os ao servidor.
 */
export async function syncPendingSessionsOffline(
  syncFn: (payload: FinishSessionInput) => Promise<{ ok?: boolean; message?: string }>
): Promise<{ syncedCount: number; failedCount: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = await getPendingSessionsOffline();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      const res = await syncFn(item.payload);
      if (res.ok) {
        await removePendingSessionOffline(item.id);
        syncedCount++;
      } else {
        // Se for erro definitivo (ex: já finalizada), remove para não travar a fila
        if (
          res.message?.includes("já foi concluída") ||
          res.message?.includes("não encontrada")
        ) {
          await removePendingSessionOffline(item.id);
        }
        failedCount++;
      }
    } catch {
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}

/**
 * Listener reativo para mudanças no estado de conexão de rede.
 */
export function subscribeNetworkStatus(onChange: (isOnline: boolean) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
