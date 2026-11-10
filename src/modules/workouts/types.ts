import { z } from "zod";

export const prescribedSetSchema = z.object({
  setNumber: z.number().int().positive(),
  repsTarget: z.string().min(1),
  suggestedLoadKg: z.number().nonnegative().optional(),
  restSeconds: z.number().int().min(0).default(60),
  tempo: z.string().optional(),
  targetRpe: z.number().min(1).max(10).optional(),
});

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  supersetGroupId: z.string().optional(),
  sectionType: z.enum(["WARMUP", "MAIN", "COOLDOWN"]).default("MAIN"),
  orderIndex: z.number().int().nonnegative(),
  coachNotes: z.string().optional(),
  sets: z.array(prescribedSetSchema),
});

export const trainingDaySchema = z.object({
  name: z.string().min(1),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY", "ANY"]),
  description: z.string().optional(),
  orderIndex: z.number().int().nonnegative(),
  exercises: z.array(workoutExerciseSchema),
});

export type PrescribedSetInput = z.infer<typeof prescribedSetSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;
export type TrainingDayInput = z.infer<typeof trainingDaySchema>;
