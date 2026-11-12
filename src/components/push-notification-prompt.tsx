"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Droplets, Moon, Sparkles, Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  savePushSubscriptionAction,
  sendHabitTestPushAction,
} from "@/modules/notifications/push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationPrompt() {
  const [supported, setSupported] = useState(false);
  const [_permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [testingHabit, setTestingHabit] = useState<string | null>(null);

  const handleTestHabit = async (type: "WATER" | "NUTRITION" | "SLEEP") => {
    setTestingHabit(type);
    try {
      const res = await sendHabitTestPushAction(type);
      if (res.error) {
        alert(res.error);
      }
    } finally {
      setTestingHabit(null);
    }
  };

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    setSupported(true);
    setPermission(Notification.permission);

    // Verifica se já existe inscrição ativa no Service Worker
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setIsSubscribed(true);
        }
      });
    });
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("Chave VAPID pública não configurada.");
      }

      // 1. Pede permissão nativa no iPhone / Android
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        alert("Permissão para notificações não foi autorizada no dispositivo.");
        setLoading(false);
        return;
      }

      // 2. Inscreve no Apple Push Notification Service (APNs) ou Google Cloud Messaging
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Falha ao capturar credenciais push do navegador.");
      }

      // 3. Salva no banco de dados do FitFlow
      const res = await savePushSubscriptionAction({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      setIsSubscribed(true);
    } catch (error: unknown) {
      console.error("[PushNotificationPrompt]", error);
      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar as notificações push."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!supported || dismissed) {
    return null;
  }

  // Painel de confirmação e testes de hábitos para quem já ativou
  if (isSubscribed) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-card p-3.5 shadow-sm">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Ocultar aviso de notificações"
          className="absolute right-2.5 top-2.5 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2 mb-1.5 pr-6">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Check className="h-3 w-3 stroke-[2.5]" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            Lembretes no Celular Ativados
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5 pr-4">
          Você receberá avisos automáticos de treinos, água, alimentação e sono com o app fechado. Teste o toque agora:
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTestHabit("WATER")}
            disabled={testingHabit !== null}
            className="h-7 text-[11px] px-2.5 gap-1 hover:text-cyan-400 hover:border-cyan-500/40"
          >
            <Droplets className="h-3 w-3 text-cyan-500" />
            {testingHabit === "WATER" ? "Enviando..." : "Testar Água"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTestHabit("NUTRITION")}
            disabled={testingHabit !== null}
            className="h-7 text-[11px] px-2.5 gap-1 hover:text-emerald-400 hover:border-emerald-500/40"
          >
            <Utensils className="h-3 w-3 text-emerald-500" />
            {testingHabit === "NUTRITION" ? "Enviando..." : "Testar Alimentação"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTestHabit("SLEEP")}
            disabled={testingHabit !== null}
            className="h-7 text-[11px] px-2.5 gap-1 hover:text-indigo-300 hover:border-indigo-400/40"
          >
            <Moon className="h-3 w-3 text-indigo-400" />
            {testingHabit === "SLEEP" ? "Enviando..." : "Testar Sono"}
          </Button>
        </div>
      </div>
    );
  }

  // Card de ativação inicial (aparece apenas quando ainda não estiver inscrito)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-4 shadow-lg">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dispensar aviso"
        className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1 pr-6 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Segundo Plano</span>
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            Receber avisos com o app fechado
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seja avisado sobre novos treinos prescritos e lembretes diários mesmo com o celular bloqueado ou app fechado.
          </p>

          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSubscribe}
              disabled={loading}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Bell className="h-3.5 w-3.5" />
              {loading ? "Ativando..." : "Ativar Notificações no Celular"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
