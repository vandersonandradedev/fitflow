"use server";

import { getTenantContext } from "@/server/auth/session";
import { registerPushSubscription, removePushSubscription } from "./service";
import { pushSubscriptionSchema } from "./types";

export async function subscribeToPushAction(rawInput: unknown) {
  try {
    const ctx = await getTenantContext();
    const parsed = pushSubscriptionSchema.parse(rawInput);
    await registerPushSubscription(ctx, parsed);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Erro ao registrar notificação push.",
    };
  }
}

export async function unsubscribeFromPushAction(endpoint: string) {
  try {
    const ctx = await getTenantContext();
    await removePushSubscription(ctx, endpoint);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Erro ao remover notificação push.",
    };
  }
}
