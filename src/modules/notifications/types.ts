import { z } from "zod";

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Endpoint de notificação inválido"),
  keys: z.object({
    p256dh: z.string().min(1, "Chave p256dh obrigatória"),
    auth: z.string().min(1, "Chave auth obrigatória"),
  }),
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid("ID de usuário inválido"),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: z.enum([
    "WORKOUT_ASSIGNED",
    "WORKOUT_COMPLETED",
    "PR_ACHIEVED",
    "INVITE",
    "SYSTEM",
    "CHURN_ALERT",
  ]).default("SYSTEM"),
  link: z.string().max(500).optional(),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
