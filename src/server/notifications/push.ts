import { sendNotification, setVapidDetails, WebPushError } from "web-push";
import { prisma } from "@/lib/db";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contato@fitflow.app";

  if (!publicKey || !privateKey) {
    console.warn("[web-push] Chaves VAPID não configuradas. Notificações push desativadas.");
    return false;
  }

  setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Salva ou atualiza a inscrição push do usuário (navegador / dispositivo).
 */
export async function savePushSubscription(params: {
  tenantId: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: params.endpoint },
    update: {
      userId: params.userId,
      tenantId: params.tenantId,
      p256dh: params.p256dh,
      auth: params.auth,
      updatedAt: new Date(),
    },
    create: {
      endpoint: params.endpoint,
      userId: params.userId,
      tenantId: params.tenantId,
      p256dh: params.p256dh,
      auth: params.auth,
    },
  });
}

/**
 * Remove uma inscrição push desativada ou revogada.
 */
export async function removePushSubscription(endpoint: string) {
  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  } catch (error) {
    console.error("[web-push] Erro ao remover inscrição:", error);
  }
}

/**
 * Dispara uma notificação push para todos os dispositivos cadastrados de um usuário.
 * Funciona com o aplicativo em segundo plano ou fechado no iPhone / Android.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/student/today",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          data
        );
        sent++;
      } catch (error: unknown) {
        failed++;
        // 410 Gone ou 404 Not Found indica que a inscrição expirou no Apple/Google Push Service
        if (error instanceof WebPushError && (error.statusCode === 410 || error.statusCode === 404)) {
          await removePushSubscription(sub.endpoint);
        } else {
          console.error(
            `[web-push] Falha ao enviar para ${sub.endpoint}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
    })
  );

  return { sent, failed };
}
