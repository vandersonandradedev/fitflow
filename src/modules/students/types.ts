import { z } from "zod";
import { emailSchema } from "@/modules/auth/types";

export const studentStatusSchema = z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]);
const fitnessGoal = z.enum(["HYPERTROPHY", "WEIGHT_LOSS", "STRENGTH", "HEALTH", "REHABILITATION"]);
const experienceLevel = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const createStudentInviteSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2, "O nome deve ter no mínimo 2 caracteres").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9()+\-\s]*$/, "Telefone inválido")
    .optional()
    .transform((v) => (v ? v : undefined)),
  fitnessGoal: fitnessGoal.default("HYPERTROPHY"),
  experienceLevel: experienceLevel.default("BEGINNER"),
});

/**
 * Campos que o treinador pode editar. `tenantId`, `userId` e `deletedAt` NÃO fazem parte do schema:
 * zod descarta chaves desconhecidas, então não é possível injetá-los via formulário (mass assignment).
 * Dados de saúde são opcionais e limitados; o sistema não faz diagnóstico.
 */
export const updateStudentSchema = z.object({
  phone: z.string().trim().max(30).regex(/^[0-9()+\-\s]*$/, "Telefone inválido").nullish(),
  birthDate: z.coerce.date().max(new Date(), "Data de nascimento inválida").nullish(),
  fitnessGoal: fitnessGoal.optional(),
  experienceLevel: experienceLevel.optional(),
  status: studentStatusSchema.optional(),
  trainerNotes: z.string().max(2000).nullish(),
  healthConditions: z.string().max(1000).nullish(),
});

export const listStudentsSchema = z.object({
  status: studentStatusSchema.optional(),
  search: z.string().trim().max(100).optional(),
  take: z.number().int().min(1).max(100).default(50),
});

export type CreateStudentInviteInput = z.infer<typeof createStudentInviteSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsInput = z.input<typeof listStudentsSchema>;
