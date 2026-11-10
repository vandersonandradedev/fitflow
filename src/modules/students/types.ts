import { z } from "zod";

export const createStudentInviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  phone: z.string().optional(),
  fitnessGoal: z.enum(["HYPERTROPHY", "WEIGHT_LOSS", "STRENGTH", "HEALTH", "REHABILITATION"]).default("HYPERTROPHY"),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
});

export type CreateStudentInviteInput = z.infer<typeof createStudentInviteSchema>;
