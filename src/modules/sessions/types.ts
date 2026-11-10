import { z } from "zod";

export const logSetSchema = z.object({
  setNumber: z.number().int().positive(),
  prescribedLoadKg: z.number().optional(),
  actualLoadKg: z.number().nonnegative(),
  prescribedReps: z.string().optional(),
  actualReps: z.number().int().nonnegative(),
  completed: z.boolean().default(true),
  restTakenSeconds: z.number().int().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
});

export const completeSessionSchema = z.object({
  sessionId: z.string().uuid(),
  perceivedExertionRpe: z.number().int().min(1).max(10).optional(),
  studentFeedback: z.string().optional(),
  totalDurationSeconds: z.number().int().positive(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
