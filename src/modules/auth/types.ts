import { z } from "zod";

/** bcrypt ignora tudo após 72 bytes; limitar evita senhas "aceitas" mas silenciosamente truncadas. */
const password = z
  .string()
  .min(10, "A senha deve ter no mínimo 10 caracteres")
  .refine((v) => new TextEncoder().encode(v).length <= 72, "A senha deve ter no máximo 72 bytes");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("E-mail inválido").max(255));

export const loginSchema = z.object({
  email,
  // No login não aplicamos a política de complexidade, apenas limites de tamanho.
  password: z.string().min(1, "Informe a senha").max(200),
});

export const registerCoachSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter no mínimo 2 caracteres").max(120),
  tenantName: z.string().trim().min(2, "O nome do studio deve ter no mínimo 2 caracteres").max(120),
  email,
  password,
  acceptTerms: z.literal("on", { error: "É necessário aceitar os termos de uso e a política de privacidade" }),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(100),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: password,
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(100),
  password,
  acceptTerms: z.literal("on", { error: "É necessário aceitar os termos de uso e a política de privacidade" }),
});

export const tokenOnlySchema = z.object({ token: z.string().min(20).max(100) });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCoachInput = z.infer<typeof registerCoachSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export { email as emailSchema };

/** Versão vigente dos termos; gravada junto ao consentimento do usuário (LGPD). */
export const CURRENT_TERMS_VERSION = "2026-11";
