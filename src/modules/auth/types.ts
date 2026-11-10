import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export const registerCoachSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  tenantName: z.string().min(2, "O nome da empresa/studio deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCoachInput = z.infer<typeof registerCoachSchema>;
