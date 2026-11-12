"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos sem atividade
const MAX_SESSION_MS = 4 * 60 * 60 * 1000; // 4 horas por sessão
const STORAGE_LAST_ACTIVITY = "fitflow_last_activity";
const STORAGE_SESSION_START = "fitflow_session_start";

export function SessionActivityMonitor() {
  const pathname = usePathname();
  const lastWriteRef = useRef<number>(0);
  const isTerminatingRef = useRef<boolean>(false);

  useEffect(() => {
    // Monitora somente áreas autenticadas (treinador e aluno)
    const isProtected = pathname?.startsWith("/coach") || pathname?.startsWith("/student");
    if (!isProtected) {
      return;
    }

    const now = Date.now();

    // 1. Inicializa timestamps se ainda não existirem
    const storedStart = localStorage.getItem(STORAGE_SESSION_START);
    const storedLast = localStorage.getItem(STORAGE_LAST_ACTIVITY);

    if (!storedStart) {
      localStorage.setItem(STORAGE_SESSION_START, String(now));
    }
    if (!storedLast) {
      localStorage.setItem(STORAGE_LAST_ACTIVITY, String(now));
    }

    const terminateSession = async (reason: "inactivity" | "expired") => {
      if (isTerminatingRef.current) return;
      isTerminatingRef.current = true;

      try {
        localStorage.removeItem(STORAGE_LAST_ACTIVITY);
        localStorage.removeItem(STORAGE_SESSION_START);
        await logoutAction();
      } catch {
        // Fallback direto via navegação se a Server Action falhar
        window.location.href = `/login?reason=${reason}`;
        return;
      }

      window.location.href = `/login?reason=${reason}`;
    };

    // 2. Função de validação de expiração
    const verifySession = () => {
      if (isTerminatingRef.current) return;

      const currentTime = Date.now();
      const lastActivity = Number(localStorage.getItem(STORAGE_LAST_ACTIVITY) || currentTime);
      const sessionStart = Number(localStorage.getItem(STORAGE_SESSION_START) || currentTime);

      // Verificação de inatividade (máx. 30 minutos)
      if (currentTime - lastActivity >= IDLE_TIMEOUT_MS) {
        terminateSession("inactivity");
        return;
      }

      // Verificação de tempo total de sessão (máx. 4 horas)
      if (currentTime - sessionStart >= MAX_SESSION_MS) {
        terminateSession("expired");
        return;
      }
    };

    // 3. Atualiza timestamp de atividade (com debounce/throttle de 10s para poupar I/O)
    const recordActivity = () => {
      const currentTime = Date.now();
      if (currentTime - lastWriteRef.current > 10_000) {
        lastWriteRef.current = currentTime;
        localStorage.setItem(STORAGE_LAST_ACTIVITY, String(currentTime));
      }
    };

    // Registra listeners de interação do usuário
    const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    // 4. Executa checagem imediata ao focar na janela ou acordar o celular (PWA)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        verifySession();
      }
    };

    window.addEventListener("focus", verifySession);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 5. Timer de verificação em background a cada 15 segundos
    const interval = setInterval(verifySession, 15_000);

    // Checagem inicial ao montar
    verifySession();

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", verifySession);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
    };
  }, [pathname]);

  return null;
}
