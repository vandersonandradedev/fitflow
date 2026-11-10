import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/server/audit";
import { appUrl, sendEmail } from "@/server/email";
import { ConflictError, UnauthorizedError, ValidationError } from "@/server/errors";
import { hashPassword, verifyPassword } from "@/server/security/password";
import { RATE_LIMITS, enforceRateLimit, resetRateLimit } from "@/server/security/rate-limit";
import { TOKEN_TTL_MS, generateToken, hashToken } from "@/server/security/tokens";
import { parseInput } from "@/server/validation";
import {
  CURRENT_TERMS_VERSION,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerCoachSchema,
  resetPasswordSchema,
  tokenOnlySchema,
} from "./types";

export interface RequestMeta {
  ip: string;
}

function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "studio"}-${randomBytes(3).toString("hex")}`;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function isEmailVerificationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
}

/**
 * Cadastro de personal: cria atomicamente User + Tenant + vínculo OWNER + token de verificação.
 * A resposta é a mesma quando o e-mail já existe (evita enumeração de contas); nesse caso o
 * dono do e-mail recebe um aviso em vez de um link de verificação.
 */
export async function registerCoach(input: unknown, meta: RequestMeta): Promise<void> {
  const data = parseInput(registerCoachSchema, input);
  await enforceRateLimit(RATE_LIMITS.register, meta.ip);

  // O hash é calculado antes de consultar o e-mail para equalizar o tempo de resposta.
  const passwordHash = await hashPassword(data.password);
  const { token, tokenHash } = generateToken();

  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) {
    await sendEmail({
      to: data.email,
      subject: "Tentativa de cadastro no FitFlow",
      text: `Alguém tentou criar uma conta no FitFlow com este e-mail, que já está cadastrado.\nSe foi você, acesse ${appUrl("/login")} ou use "Esqueci minha senha".`,
    });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          termsVersion: CURRENT_TERMS_VERSION,
          termsAcceptedAt: new Date(),
        },
      });
      const tenant = await tx.tenant.create({ data: { name: data.tenantName, slug: slugify(data.tenantName) } });
      await tx.tenantMember.create({ data: { tenantId: tenant.id, userId: user.id, role: "OWNER" } });
      await tx.verificationToken.create({
        data: {
          identifier: data.email,
          token: tokenHash,
          expires: new Date(Date.now() + TOKEN_TTL_MS.emailVerification),
        },
      });
      await writeAudit(tx, {
        tenantId: tenant.id,
        userId: user.id,
        action: "COACH_REGISTERED",
        resource: "tenant",
        resourceId: tenant.id,
        ipAddress: meta.ip,
      });
    });
  } catch (error) {
    // Corrida entre dois cadastros simultâneos com o mesmo e-mail: trata como "já existe".
    if (isUniqueViolation(error)) return;
    throw error;
  }

  await sendEmail({
    to: data.email,
    subject: "Confirme seu e-mail no FitFlow",
    text: `Olá, ${data.name}!\nConfirme seu e-mail para ativar sua conta (link válido por 24 horas):\n${appUrl(`/verify-email?token=${token}`)}`,
  });
}

/** Consome o token de verificação (uso único). Retorna false para token inválido/expirado/já usado. */
export async function verifyEmail(input: unknown): Promise<boolean> {
  const { token } = parseInput(tokenOnlySchema, input);
  const tokenHash = hashToken(token);

  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findUnique({ where: { token: tokenHash } });
    if (!record || record.expires.getTime() < Date.now()) return false;

    // deleteMany garante uso único mesmo com duas requisições simultâneas.
    const consumed = await tx.verificationToken.deleteMany({ where: { token: tokenHash } });
    if (consumed.count !== 1) return false;

    await tx.user.update({ where: { email: record.identifier }, data: { emailVerified: new Date() } });
    return true;
  });
}

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string;
  sessionVersion: number;
}

export type LoginFailure = "invalid_credentials" | "email_not_verified" | "rate_limited";

export class LoginError extends Error {
  constructor(public readonly reason: LoginFailure) {
    super(reason);
  }
}

/**
 * Validação de credenciais usada pelo provider do Auth.js. Fica aqui (e não na action) porque o
 * endpoint /api/auth/callback/credentials é acessível diretamente: o rate limit e a checagem
 * de senha precisam valer para qualquer caminho de login.
 */
export async function authenticateCredentials(input: unknown, meta: RequestMeta): Promise<AuthenticatedUser> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) throw new LoginError("invalid_credentials");
  const { email, password } = parsed.data;

  try {
    await enforceRateLimit(RATE_LIMITS.loginByIp, meta.ip);
    await enforceRateLimit(RATE_LIMITS.loginByEmail, email);
  } catch {
    throw new LoginError("rate_limited");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true, emailVerified: true, sessionVersion: true },
  });

  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) throw new LoginError("invalid_credentials");

  // Só revelamos "e-mail não verificado" depois de a senha estar correta (sem enumeração).
  if (isEmailVerificationRequired() && !user.emailVerified) throw new LoginError("email_not_verified");

  await resetRateLimit(RATE_LIMITS.loginByEmail, email);
  await writeAudit(prisma, { userId: user.id, action: "LOGIN", resource: "user", resourceId: user.id, ipAddress: meta.ip });

  return { id: user.id, name: user.name, email: user.email, sessionVersion: user.sessionVersion };
}

/** Pede reset de senha. Sempre retorna sem erro para não revelar se o e-mail existe. */
export async function requestPasswordReset(input: unknown, meta: RequestMeta): Promise<void> {
  const { email } = parseInput(forgotPasswordSchema, input);
  try {
    await enforceRateLimit(RATE_LIMITS.passwordReset, email);
  } catch {
    return; // silencioso: não confirma nem nega a existência da conta
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  if (!user?.passwordHash) return;

  const { token, tokenHash } = generateToken();
  await prisma.$transaction(async (tx) => {
    // Invalida pedidos anteriores ainda não usados: só o link mais recente funciona.
    await tx.passwordResetToken.deleteMany({ where: { email, usedAt: null } });
    await tx.passwordResetToken.create({
      data: { email, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS.passwordReset) },
    });
    await writeAudit(tx, { userId: user.id, action: "PASSWORD_RESET_REQUESTED", resource: "user", resourceId: user.id, ipAddress: meta.ip });
  });

  await sendEmail({
    to: email,
    subject: "Redefinição de senha do FitFlow",
    text: `Use o link abaixo para criar uma nova senha (válido por 1 hora, uso único):\n${appUrl(`/reset-password?token=${token}`)}\nSe você não pediu, ignore esta mensagem.`,
  });
}

/** Troca a senha com token de uso único e revoga todas as sessões existentes. */
export async function resetPassword(input: unknown, meta: RequestMeta): Promise<void> {
  const { token, password } = parseInput(resetPasswordSchema, input);
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    // updateMany condicionado a usedAt IS NULL e expiração: apenas UMA requisição consegue consumir.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new ValidationError("Link inválido ou expirado.");

    const record = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash }, select: { email: true } });
    const user = await tx.user.update({
      where: { email: record.email },
      data: { passwordHash, sessionVersion: { increment: 1 } },
      select: { id: true },
    });
    await writeAudit(tx, { userId: user.id, action: "PASSWORD_RESET_COMPLETED", resource: "user", resourceId: user.id, ipAddress: meta.ip });
  });
}

/** Alteração de senha pelo próprio usuário autenticado. Revoga todas as sessões (inclusive a atual). */
export async function changePassword(userId: string, input: unknown, meta: RequestMeta): Promise<void> {
  const { currentPassword, newPassword } = parseInput(changePasswordSchema, input);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new UnauthorizedError("Senha atual incorreta.");
  }
  if (currentPassword === newPassword) throw new ConflictError("A nova senha deve ser diferente da atual.");

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    await writeAudit(tx, { userId, action: "PASSWORD_CHANGED", resource: "user", resourceId: userId, ipAddress: meta.ip });
  });
}

/** Encerra todas as sessões do usuário em todos os dispositivos. */
export async function revokeAllSessions(userId: string, meta: RequestMeta): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
    await writeAudit(tx, { userId, action: "SESSIONS_REVOKED", resource: "user", resourceId: userId, ipAddress: meta.ip });
  });
}
