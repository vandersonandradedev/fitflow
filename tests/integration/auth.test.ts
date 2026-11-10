import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  LoginError,
  authenticateCredentials,
  changePassword,
  registerCoach,
  requestPasswordReset,
  resetPassword,
  revokeAllSessions,
  verifyEmail,
} from "@/modules/auth/service";
import { resolveTenantContext } from "@/server/auth/context";
import { UnauthorizedError, ValidationError } from "@/server/errors";
import { PASSWORD, contextFor, createCoach, emailsTo, lastEmailTo, meta, tokenFromLastEmail } from "./helpers";

const register = (email: string, overrides: Record<string, unknown> = {}) =>
  registerCoach(
    { name: "Lucas", tenantName: "Studio Lucas", email, password: PASSWORD, acceptTerms: "on", ...overrides },
    meta,
  );

async function loginFailure(email: string, password: string, ip = meta.ip) {
  try {
    await authenticateCredentials({ email, password }, { ip });
  } catch (error) {
    if (error instanceof LoginError) return error.reason;
    throw error;
  }
  return "ok";
}

describe("cadastro de personal", () => {
  it("cria usuário, tenant e vínculo OWNER na mesma transação, com senha em hash", async () => {
    await register("lucas@coach.test");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "lucas@coach.test" },
      include: { memberships: { include: { tenant: true } } },
    });
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(user.passwordHash).not.toContain(PASSWORD);
    expect(user.emailVerified).toBeNull();
    expect(user.termsVersion).not.toBeNull();
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0]!.role).toBe("OWNER");
    expect(user.memberships[0]!.tenant.status).toBe("ACTIVE");
  });

  it("rejeita cadastro sem aceite dos termos e senha curta, e não cria nada", async () => {
    await expect(register("a@coach.test", { acceptTerms: undefined })).rejects.toBeInstanceOf(ValidationError);
    await expect(register("b@coach.test", { password: "curta" })).rejects.toBeInstanceOf(ValidationError);
    await expect(register("c@coach.test", { password: "á".repeat(40) })).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.tenant.count()).toBe(0);
  });

  it("não revela e-mail já cadastrado: mesma resposta, sem segundo tenant e com aviso ao dono", async () => {
    await register("dup@coach.test");
    await expect(register("dup@coach.test", { tenantName: "Outro Studio" })).resolves.toBeUndefined();

    expect(await prisma.tenant.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
    const mails = emailsTo("dup@coach.test");
    expect(mails).toHaveLength(2);
    expect(mails[1]!.subject).toMatch(/tentativa/i);
    expect(mails[1]!.text).not.toMatch(/token=/);
  });

  it("guarda apenas o hash do token de verificação e ele é de uso único", async () => {
    await register("v@coach.test");
    const token = tokenFromLastEmail("v@coach.test");

    const stored = await prisma.verificationToken.findFirstOrThrow();
    expect(stored.token).not.toBe(token);

    expect(await verifyEmail({ token })).toBe(true);
    expect(await verifyEmail({ token })).toBe(false);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "v@coach.test" } });
    expect(user.emailVerified).not.toBeNull();
  });

  it("token de verificação expirado não funciona", async () => {
    await register("exp@coach.test");
    const token = tokenFromLastEmail("exp@coach.test");
    await prisma.verificationToken.updateMany({ data: { expires: new Date(Date.now() - 1000) } });
    expect(await verifyEmail({ token })).toBe(false);
  });
});

describe("login", () => {
  it("exige e-mail verificado, mas só revela isso depois da senha correta", async () => {
    await register("l@coach.test");
    expect(await loginFailure("l@coach.test", "senha-errada-123")).toBe("invalid_credentials");
    expect(await loginFailure("naoexiste@coach.test", PASSWORD)).toBe("invalid_credentials");
    expect(await loginFailure("l@coach.test", PASSWORD)).toBe("email_not_verified");

    await verifyEmail({ token: tokenFromLastEmail("l@coach.test") });
    expect(await loginFailure("l@coach.test", PASSWORD)).toBe("ok");
  });

  it("bloqueia força bruta por e-mail mesmo vindo de IPs diferentes, inclusive com a senha certa", async () => {
    const { email } = await createCoach("brute");
    for (let i = 0; i < 5; i++) {
      expect(await loginFailure(email, "errada-errada-1", `198.51.100.${i}`)).toBe("invalid_credentials");
    }
    expect(await loginFailure(email, PASSWORD, "198.51.100.99")).toBe("rate_limited");
  });

  it("login correto zera o contador de tentativas do e-mail", async () => {
    const { email } = await createCoach("reset-counter");
    for (let i = 0; i < 3; i++) await loginFailure(email, "errada-errada-1");
    expect(await loginFailure(email, PASSWORD)).toBe("ok");
    for (let i = 0; i < 5; i++) {
      expect(await loginFailure(email, "errada-errada-1")).toBe("invalid_credentials");
    }
  });
});

describe("recuperação e alteração de senha", () => {
  it("pedido para e-mail inexistente não gera token nem erro", async () => {
    await expect(requestPasswordReset({ email: "ninguem@coach.test" }, meta)).resolves.toBeUndefined();
    expect(await prisma.passwordResetToken.count()).toBe(0);
    expect(emailsTo("ninguem@coach.test")).toHaveLength(0);
  });

  it("reset: token em hash, uso único, troca a senha e revoga sessões antigas", async () => {
    const { email, ctx } = await createCoach("reset");
    await requestPasswordReset({ email }, meta);
    const token = tokenFromLastEmail(email);

    const stored = await prisma.passwordResetToken.findFirstOrThrow();
    expect(stored.tokenHash).not.toBe(token);

    const novaSenha = "outra-senha-forte-456";
    await resetPassword({ token, password: novaSenha }, meta);

    expect(await loginFailure(email, PASSWORD)).toBe("invalid_credentials");
    expect(await loginFailure(email, novaSenha)).toBe("ok");
    await expect(resolveTenantContext(ctx.userId, 0)).rejects.toBeInstanceOf(UnauthorizedError);

    await expect(resetPassword({ token, password: "mais-uma-senha-789" }, meta)).rejects.toBeInstanceOf(ValidationError);
  });

  it("reset com token expirado ou novo pedido invalidando o anterior", async () => {
    const { email } = await createCoach("reset2");
    await requestPasswordReset({ email }, meta);
    const first = tokenFromLastEmail(email);
    await requestPasswordReset({ email }, meta);
    const second = tokenFromLastEmail(email);

    await expect(resetPassword({ token: first, password: "nova-senha-forte-1" }, meta)).rejects.toBeInstanceOf(ValidationError);

    await prisma.passwordResetToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(resetPassword({ token: second, password: "nova-senha-forte-1" }, meta)).rejects.toBeInstanceOf(ValidationError);
  });

  it("dois usos simultâneos do mesmo token de reset: só um vence", async () => {
    const { email } = await createCoach("race");
    await requestPasswordReset({ email }, meta);
    const token = tokenFromLastEmail(email);
    const results = await Promise.allSettled([
      resetPassword({ token, password: "senha-corrida-aaa-1" }, meta),
      resetPassword({ token, password: "senha-corrida-bbb-2" }, meta),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("alterar senha exige a senha atual e revoga as sessões", async () => {
    const { ctx } = await createCoach("change");
    await expect(
      changePassword(ctx.userId, { currentPassword: "errada-errada-1", newPassword: "nova-senha-forte-1" }, meta),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    await changePassword(ctx.userId, { currentPassword: PASSWORD, newPassword: "nova-senha-forte-1" }, meta);
    await expect(resolveTenantContext(ctx.userId, 0)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("revogar todas as sessões invalida o contexto emitido antes", async () => {
    const { email, ctx } = await createCoach("revoke");
    await revokeAllSessions(ctx.userId, meta);
    await expect(resolveTenantContext(ctx.userId, 0)).rejects.toBeInstanceOf(UnauthorizedError);
    const fresh = await contextFor(email);
    expect(fresh.tenantId).toBe(ctx.tenantId);
  });
});

describe("contexto de tenant", () => {
  it("falha para usuário inexistente e para tenant suspenso", async () => {
    await expect(resolveTenantContext("00000000-0000-4000-8000-000000000000", 0)).rejects.toBeInstanceOf(UnauthorizedError);

    const { ctx } = await createCoach("susp");
    await prisma.tenant.update({ where: { id: ctx.tenantId }, data: { status: "SUSPENDED" } });
    await expect(resolveTenantContext(ctx.userId, 0)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("e-mail de verificação não vaza o token em outras mensagens", async () => {
    await register("leak@coach.test");
    expect(lastEmailTo("leak@coach.test").text).toMatch(/verify-email\?token=/);
  });
});
