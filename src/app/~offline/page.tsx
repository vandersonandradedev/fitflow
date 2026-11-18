"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FitFlowLogo } from "@/components/ui/logo";

export default function OfflineFallbackPage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      window.location.href = "/student/today";
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <FitFlowLogo size="md" priority />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            {isOnline ? (
              <Wifi className="h-7 w-7 text-emerald-400 animate-pulse" />
            ) : (
              <WifiOff className="h-7 w-7 text-amber-400" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              {isOnline ? "Conexão Restabelecida!" : "Você está em Modo Offline"}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isOnline
                ? "Reconectado à internet. Redirecionando para o seu treino..."
                : "Sem sinal de internet no momento. Suas séries e cargas salvas continuam guardadas no aparelho."}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link href="/student/today" className="block">
              <Button size="touch" className="w-full gap-2">
                <Dumbbell className="h-4 w-4" />
                Acessar Treino de Hoje
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="w-full gap-1.5 text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar reconectar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
