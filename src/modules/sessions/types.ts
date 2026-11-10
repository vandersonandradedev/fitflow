import { z } from "zod";

export const logSetInputSchema = z.object({
  setNumber: z.number().int().positive(),
  prescribedLoadKg: z.number().nonnegative().optional(),
  actualLoadKg: z.number().nonnegative("A carga não pode ser negativa"),
  prescribedReps: z.string().trim().max(50).optional(),
  actualReps: z.number().int().min(0, "Repetições não podem ser negativas"),
  completed: z.boolean().default(true),
  restTakenSeconds: z.number().int().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
});

export const logExerciseInputSchema = z.object({
  exerciseId: z.string().uuid("Exercício inválido"),
  workoutExerciseId: z.string().uuid().optional(),
  orderIndex: z.number().int().nonnegative().default(0),
  isCompleted: z.boolean().default(false),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sets: z.array(logSetInputSchema).default([]),
});

export const startSessionSchema = z.object({
  trainingDayId: z.string().uuid("Dia de treino inválido"),
});

export const finishSessionSchema = z.object({
  sessionId: z.string().uuid("Sessão inválida"),
  perceivedExertionRpe: z.number().int().min(1).max(10).optional(),
  studentFeedback: z
    .string()
    .trim()
    .max(1500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  totalDurationSeconds: z
    .number()
    .int()
    .min(1, "Duração mínima de 1 segundo")
    .max(86400, "Duração máxima de 24 horas"),
  exercises: z.array(logExerciseInputSchema).min(1, "A sessão deve conter ao menos um exercício"),
});

export const sessionHistoryFilterSchema = z.object({
  studentProfileId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(30),
});

export type LogSetInput = z.infer<typeof logSetInputSchema>;
export type LogExerciseInput = z.infer<typeof logExerciseInputSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type FinishSessionInput = z.infer<typeof finishSessionSchema>;
export type SessionHistoryFilterInput = z.infer<typeof sessionHistoryFilterSchema>;

// Aliases para compatibilidade retroativa
export const logSetSchema = logSetInputSchema;
export const completeSessionSchema = finishSessionSchema;
export type CompleteSessionInput = FinishSessionInput;
