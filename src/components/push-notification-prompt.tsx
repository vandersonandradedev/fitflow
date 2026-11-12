"use client";

import { useEffect, useState } from "react";
import { Bell, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePushSubscriptionAction } from "@/modules/notifications/push-actions";

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

  if (!supported || isSubscribed || dismissed) {
    return null;
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
