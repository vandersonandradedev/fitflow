import { z } from "zod";

export const progressionTierSchema = z.enum([
  "PROGRESSION", // Aumento de carga ou reps
  "MAINTENANCE", // Manutenção para consolidação
  "DELOAD", // Redução profilática de fadiga
  "NEW_EXERCISE", // Sem histórico prévio
]);

export const exerciseSuggestionSchema = z.object({
  exerciseId: z.string().uuid(),
  exerciseName: z.string(),
  currentLoadKg: z.number().nullable(),
  suggestedLoadKg: z.number().nullable(),
  currentReps: z.string().nullable(),
  suggestedReps: z.string(),
  suggestedRestSeconds: z.number().int().default(60),
  progressionTier: progressionTierSchema,
  averageRpe: z.number().nullable(),
  estimated1Rm: z.number().nullable(),
  recentSessionsCount: z.number().int(),
  rationale: z.string(),
});

export const copilotAnalysisSchema = z.object({
  studentProfileId: z.string().uuid(),
  studentName: z.string(),
  trainingDayId: z.string().uuid(),
  dayName: z.string(),
  overallTrend: z.string(),
  suggestions: z.array(exerciseSuggestionSchema),
});

export type ProgressionTier = z.infer<typeof progressionTierSchema>;
export type ExerciseSuggestion = z.infer<typeof exerciseSuggestionSchema>;
export type CopilotAnalysis = z.infer<typeof copilotAnalysisSchema>;
