import { z } from "zod";

export const bodyMeasurementSchema = z.object({
  weightKg: z.number().positive(),
  heightCm: z.number().positive().optional(),
  bodyFatPercentage: z.number().min(1).max(70).optional(),
  muscleMassPercentage: z.number().min(1).max(90).optional(),
  chestCm: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  abdomenCm: z.number().positive().optional(),
  hipsCm: z.number().positive().optional(),
  rightArmCm: z.number().positive().optional(),
  leftArmCm: z.number().positive().optional(),
  rightThighCm: z.number().positive().optional(),
  leftThighCm: z.number().positive().optional(),
  rightCalfCm: z.number().positive().optional(),
  leftCalfCm: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type BodyMeasurementInput = z.infer<typeof bodyMeasurementSchema>;
