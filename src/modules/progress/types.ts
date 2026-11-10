import { z } from "zod";

export const physicalAssessmentInputSchema = z.object({
  studentProfileId: z.string().uuid("Aluno inválido"),
  assessmentDate: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  weightKg: z
    .number()
    .positive("O peso deve ser maior que zero")
    .max(500, "Peso inválido"),
  heightCm: z
    .number()
    .positive("A altura deve ser maior que zero")
    .max(300, "Altura inválida")
    .optional(),
  bodyFatPercentage: z
    .number()
    .min(1, "Percentual mínimo de 1%")
    .max(75, "Percentual máximo de 75%")
    .optional(),
  muscleMassPercentage: z
    .number()
    .min(1, "Percentual mínimo de 1%")
    .max(90, "Percentual máximo de 90%")
    .optional(),
  chestCm: z.number().positive().max(300).optional(),
  waistCm: z.number().positive().max(300).optional(),
  abdomenCm: z.number().positive().max(300).optional(),
  hipsCm: z.number().positive().max(300).optional(),
  rightArmCm: z.number().positive().max(100).optional(),
  leftArmCm: z.number().positive().max(100).optional(),
  rightThighCm: z.number().positive().max(150).optional(),
  leftThighCm: z.number().positive().max(150).optional(),
  rightCalfCm: z.number().positive().max(100).optional(),
  leftCalfCm: z.number().positive().max(100).optional(),
  notes: z
    .string()
    .trim()
    .max(1500)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const progressFilterSchema = z.object({
  studentProfileId: z.string().uuid().optional(),
  exerciseId: z.string().uuid().optional(),
  weeksCount: z.number().int().min(1).max(52).default(8),
});

export type PhysicalAssessmentInput = z.input<typeof physicalAssessmentInputSchema>;
export type ProgressFilterInput = z.input<typeof progressFilterSchema>;

// Alias retrocompatível
export const bodyMeasurementSchema = physicalAssessmentInputSchema;
export type BodyMeasurementInput = PhysicalAssessmentInput;
