/**
 * Módulo de Gerenciamento Offline e Sincronização Resiliente (IndexedDB + Queue)
 *
 * Garante que os treinos possam ser iniciados, executados e finalizados
 * em ambientes sem conexão (academias no subsolo, falha de 4G/Wi-Fi),
 * persistindo os dados localmente e sincronizando automaticamente assim
 * que a rede for restabelecida.
 */

import { FinishSessionInput } from "@/modules/sessions/types";

const DB_NAME = "fitflow_offline_v1";
const STORE_ACTIVE = "active_sessions";
const STORE_QUEUE = "pending_finish_queue";

interface QueuedFinishSession {
  id: string; // sessionId
  payload: FinishSessionInput;
  queuedAt: string;
  retryCount: number;
}

/**
 * Abre o banco IndexedDB de forma segura com suporte a fallback.
 */
function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
          db.createObjectStore(STORE_ACTIVE, { keyPath: "sessionId" });
        }
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
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
 * Salva o estado em tempo real da sessão em andamento.
 */
export async function saveActiveSessionOffline(
  sessionId: string,
  exercises: unknown
): Promise<void> {
  // Salva no localStorage como redundância imediata
  try {
    localStorage.setItem(`fitflow_session_${sessionId}`, JSON.stringify(exercises));
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
 * Limpa a sessão em andamento após finalização ou descarte.
 */
export async function clearActiveSessionOffline(sessionId: string): Promise<void> {
  try {
    localStorage.removeItem(`fitflow_session_${sessionId}`);
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
          res.message?.includes("já foi finalizada") ||
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
