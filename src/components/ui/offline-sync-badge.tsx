"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, WifiOff } from "lucide-react";
import { finishSessionAction } from "@/app/(student)/student/session/actions";
import {
  getPendingSessionsOffline,
  subscribeNetworkStatus,
  syncPendingSessionsOffline,
} from "@/lib/offline-sync";

export function OfflineSyncBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const checkPending = async () => {
      const pending = await getPendingSessionsOffline();
      setPendingCount(pending.length);
    };

    checkPending();

    const unsubscribe = subscribeNetworkStatus(async (online) => {
      setIsOnline(online);
      if (online) {
        setIsSyncing(true);
        const { syncedCount } = await syncPendingSessionsOffline(finishSessionAction);
        setIsSyncing(false);
        if (syncedCount > 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 4000);
        }
        await checkPending();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    const { syncedCount } = await syncPendingSessionsOffline(finishSessionAction);
    setIsSyncing(false);
    if (syncedCount > 0) {
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 4000);
    }
    const pending = await getPendingSessionsOffline();
    setPendingCount(pending.length);
  };

  if (isOnline && pendingCount === 0 && !justSynced) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs">
      {!isOnline && (
        <span className="flex items-center gap-1.5 font-medium text-amber-500">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Modo Offline</span>
        </span>
      )}

      {pendingCount > 0 && (
        <span className="text-muted-foreground flex items-center gap-1.5">
          <span>{pendingCount} treino(s) pendente(s)</span>
          {isOnline && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </button>
          )}
        </span>
      )}

      {justSynced && (
        <span className="flex items-center gap-1 text-emerald-500 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Sincronizado!
        </span>
      )}
    </div>
  );
}
