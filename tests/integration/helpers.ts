import { prisma } from "@/lib/db";
import { registerCoach, verifyEmail } from "@/modules/auth/service";
import { acceptInvite, inviteStudent } from "@/modules/students/invites";
import { resolveTenantContext, type TenantContext } from "@/server/auth/context";
import { __testOutbox, type OutgoingEmail } from "@/server/email";

export const PASSWORD = "senha-super-segura-123";
export const meta = { ip: "203.0.113.10" };

export function lastEmailTo(to: string): OutgoingEmail {
  const message = [...__testOutbox].reverse().find((m) => m.to === to);
  if (!message) throw new Error(`Nenhum e-mail enviado para ${to}`);
  return message;
}

export function emailsTo(to: string): OutgoingEmail[] {
  return __testOutbox.filter((m) => m.to === to);
}

/** Extrai o token do último link enviado, como o usuário faria ao clicar no e-mail. */
export function tokenFromLastEmail(to: string): string {
  const match = lastEmailTo(to).text.match(/(?:token=|\/invite\/)([A-Za-z0-9_-]{20,})/);
  if (!match) throw new Error("Token não encontrado no e-mail");
  return match[1]!;
}

export async function contextFor(email: string): Promise<TenantContext> {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return resolveTenantContext(user.id, user.sessionVersion);
}

/** Cadastro real de personal + verificação real de e-mail. */
export async function createCoach(label: string) {
  const email = `${label.toLowerCase()}@coach.test`;
  await registerCoach(
    { name: `Personal ${label}`, tenantName: `Studio ${label}`, email, password: PASSWORD, acceptTerms: "on" },
    meta,
  );
  const verified = await verifyEmail({ token: tokenFromLastEmail(email) });
  if (!verified) throw new Error("verificação de e-mail falhou");
  return { email, ctx: await contextFor(email) };
}

/** Convite real + aceite real. */
export async function createStudent(coach: TenantContext, label: string) {
  const email = `${label.toLowerCase()}@aluno.test`;
  await inviteStudent(coach, { email, name: `Aluno ${label}` });
  await acceptInvite({ token: tokenFromLastEmail(email), password: PASSWORD, acceptTerms: "on" }, meta);
  const ctx = await contextFor(email);
  return { email, ctx, studentProfileId: ctx.studentProfileId! };
}
