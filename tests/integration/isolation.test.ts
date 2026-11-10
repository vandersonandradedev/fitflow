import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getCoachDashboard } from "@/modules/dashboard/service";
import { acceptInvite, getInvitePreview, inviteStudent, revokeInviteForTenant } from "@/modules/students/invites";
import {
  getStudentForTenant,
  listPendingInvitesForTenant,
  listStudentsForTenant,
  updateStudentForTenant,
} from "@/modules/students/service";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { PASSWORD, createCoach, createStudent, emailsTo, meta, tokenFromLastEmail } from "./helpers";

const RANDOM_UUID = "11111111-1111-4111-8111-111111111111";

async function twoTenants() {
  const a = await createCoach("a");
  const b = await createCoach("b");
  const a1 = await createStudent(a.ctx, "a1");
  const a2 = await createStudent(a.ctx, "a2");
  const b1 = await createStudent(b.ctx, "b1");
  return { a, b, a1, a2, b1 };
}

describe("isolamento entre tenants (acesso horizontal / IDOR)", () => {
  it("personal A lista apenas os alunos do próprio tenant", async () => {
    const { a, b, a1, a2, b1 } = await twoTenants();

    const listA = (await listStudentsForTenant(a.ctx)).map((s) => s.id).sort();
    expect(listA).toEqual([a1.studentProfileId, a2.studentProfileId].sort());

    const listB = (await listStudentsForTenant(b.ctx)).map((s) => s.id);
    expect(listB).toEqual([b1.studentProfileId]);
  });

  it("busca por nome/e-mail de aluno de outro tenant não retorna nada", async () => {
    const { a } = await twoTenants();
    expect(await listStudentsForTenant(a.ctx, { search: "b1" })).toHaveLength(0);
    expect(await listStudentsForTenant(a.ctx, { search: "a1" })).toHaveLength(1);
  });

  it("personal A não lê aluno de B pelo ID e o erro é idêntico ao de um ID inexistente", async () => {
    const { a, b1 } = await twoTenants();

    const foreign = await getStudentForTenant(a.ctx, b1.studentProfileId).catch((e) => e);
    const missing = await getStudentForTenant(a.ctx, RANDOM_UUID).catch((e) => e);

    expect(foreign).toBeInstanceOf(NotFoundError);
    expect(missing).toBeInstanceOf(NotFoundError);
    expect(foreign.message).toBe(missing.message);
    expect(foreign.status).toBe(missing.status);
  });

  it("personal A não altera aluno de B e o registro de B permanece intacto", async () => {
    const { a, b1 } = await twoTenants();

    await expect(
      updateStudentForTenant(a.ctx, b1.studentProfileId, { trainerNotes: "invadido", status: "ARCHIVED" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const row = await prisma.studentProfile.findUniqueOrThrow({ where: { id: b1.studentProfileId } });
    expect(row.trainerNotes).toBeNull();
    expect(row.status).toBe("ACTIVE");
  });

  it("mass assignment: tenantId/userId enviados no payload são ignorados", async () => {
    const { a, b, a1, b1 } = await twoTenants();
    const before = await prisma.studentProfile.findUniqueOrThrow({ where: { id: a1.studentProfileId } });

    await updateStudentForTenant(a.ctx, a1.studentProfileId, {
      trainerNotes: "ok",
      tenantId: b.ctx.tenantId,
      userId: b1.ctx.userId,
      deletedAt: new Date(),
    });

    const after = await prisma.studentProfile.findUniqueOrThrow({ where: { id: a1.studentProfileId } });
    expect(after.tenantId).toBe(a.ctx.tenantId);
    expect(after.userId).toBe(before.userId);
    expect(after.deletedAt).toBeNull();
    expect(after.trainerNotes).toBe("ok");
  });

  it("a atualização válida funciona dentro do próprio tenant", async () => {
    const { a, a1 } = await twoTenants();
    const updated = await updateStudentForTenant(a.ctx, a1.studentProfileId, { status: "PAUSED", phone: "(11) 99999-0000" });
    expect(updated.status).toBe("PAUSED");
    expect(updated.phone).toBe("(11) 99999-0000");
  });

  it("personal A não revoga convite de B", async () => {
    const { a, b } = await twoTenants();
    await inviteStudent(b.ctx, { email: "pendente@aluno.test", name: "Pendente" });
    const [invite] = await listPendingInvitesForTenant(b.ctx);

    await expect(revokeInviteForTenant(a.ctx, invite!.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await listPendingInvitesForTenant(a.ctx)).toHaveLength(0);
    expect((await prisma.studentInvite.findUniqueOrThrow({ where: { id: invite!.id } })).status).toBe("PENDING");
  });

  it("dashboard conta somente os dados do próprio tenant, vindos do banco", async () => {
    const { a, b, a2 } = await twoTenants();
    await updateStudentForTenant(a.ctx, a2.studentProfileId, { status: "PAUSED" });

    const dashA = await getCoachDashboard(a.ctx);
    expect(dashA).toMatchObject({ totalStudents: 2, activeStudents: 1, pausedStudents: 1, activePrograms: 0, sessionsThisWeek: 0 });
    expect(dashA.recentActivity).toEqual([]);

    const dashB = await getCoachDashboard(b.ctx);
    expect(dashB).toMatchObject({ totalStudents: 1, activeStudents: 1, pausedStudents: 0 });
  });
});

describe("controle de acesso por função", () => {
  it("aluno não executa nenhuma função de treinador", async () => {
    const { a1, a2 } = await twoTenants();

    await expect(listStudentsForTenant(a1.ctx)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getStudentForTenant(a1.ctx, a2.studentProfileId)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateStudentForTenant(a1.ctx, a1.studentProfileId, { status: "ACTIVE" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(inviteStudent(a1.ctx, { email: "x@aluno.test", name: "Xis" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listPendingInvitesForTenant(a1.ctx)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getCoachDashboard(a1.ctx)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("aluno arquivado perde o acesso", async () => {
    const { a, a1 } = await twoTenants();
    await updateStudentForTenant(a.ctx, a1.studentProfileId, { status: "ARCHIVED" });
    const { resolveTenantContext } = await import("@/server/auth/context");
    await expect(resolveTenantContext(a1.ctx.userId, 0)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("convites", () => {
  it("guarda só o hash, é de uso único e o aluno nasce no tenant de quem convidou", async () => {
    const a = await createCoach("inv");
    await inviteStudent(a.ctx, { email: "novo@aluno.test", name: "Novo Aluno", phone: "11 98888-7777" });
    const token = tokenFromLastEmail("novo@aluno.test");

    const stored = await prisma.studentInvite.findFirstOrThrow();
    expect(stored.tokenHash).not.toBe(token);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now() + 47 * 3600_000);
    expect(stored.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 48 * 3600_000);

    expect(await getInvitePreview({ token })).toEqual({ studentName: "Novo Aluno", tenantName: "Studio inv" });

    await acceptInvite({ token, password: PASSWORD, acceptTerms: "on" }, meta);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "novo@aluno.test" },
      include: { memberships: true, studentProfiles: true },
    });
    expect(user.emailVerified).not.toBeNull();
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0]).toMatchObject({ tenantId: a.ctx.tenantId, role: "STUDENT" });
    expect(user.studentProfiles[0]).toMatchObject({ tenantId: a.ctx.tenantId, phone: "11 98888-7777" });

    await expect(acceptInvite({ token, password: PASSWORD, acceptTerms: "on" }, meta)).rejects.toBeInstanceOf(ValidationError);
    expect(await getInvitePreview({ token })).toBeNull();
  });

  it("aceites simultâneos do mesmo convite: exatamente um vence e só um usuário é criado", async () => {
    const a = await createCoach("race");
    await inviteStudent(a.ctx, { email: "corrida@aluno.test", name: "Corrida" });
    const token = tokenFromLastEmail("corrida@aluno.test");

    const results = await Promise.allSettled([
      acceptInvite({ token, password: PASSWORD, acceptTerms: "on" }, meta),
      acceptInvite({ token, password: PASSWORD, acceptTerms: "on" }, meta),
      acceptInvite({ token, password: PASSWORD, acceptTerms: "on" }, meta),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.user.count({ where: { email: "corrida@aluno.test" } })).toBe(1);
    expect(await prisma.studentProfile.count({ where: { tenantId: a.ctx.tenantId } })).toBe(1);
  });

  it("convite expirado, revogado ou reemitido não pode ser aceito", async () => {
    const a = await createCoach("exp");

    await inviteStudent(a.ctx, { email: "expirado@aluno.test", name: "Expirado" });
    const expired = tokenFromLastEmail("expirado@aluno.test");
    await prisma.studentInvite.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(acceptInvite({ token: expired, password: PASSWORD, acceptTerms: "on" }, meta)).rejects.toBeInstanceOf(ValidationError);

    await inviteStudent(a.ctx, { email: "revogado@aluno.test", name: "Revogado" });
    const revoked = tokenFromLastEmail("revogado@aluno.test");
    const pending = await listPendingInvitesForTenant(a.ctx);
    await revokeInviteForTenant(a.ctx, pending.find((p) => p.email === "revogado@aluno.test")!.id);
    await expect(acceptInvite({ token: revoked, password: PASSWORD, acceptTerms: "on" }, meta)).rejects.toBeInstanceOf(ValidationError);

    await inviteStudent(a.ctx, { email: "reemitido@aluno.test", name: "Reemitido" });
    const first = tokenFromLastEmail("reemitido@aluno.test");
    await inviteStudent(a.ctx, { email: "reemitido@aluno.test", name: "Reemitido" });
    const second = tokenFromLastEmail("reemitido@aluno.test");
    expect(second).not.toBe(first);
    await expect(acceptInvite({ token: first, password: PASSWORD, acceptTerms: "on" }, meta)).rejects.toBeInstanceOf(ValidationError);
    await acceptInvite({ token: second, password: PASSWORD, acceptTerms: "on" }, meta);
  });

  it("token adulterado ou aleatório é recusado", async () => {
    const a = await createCoach("forja");
    await inviteStudent(a.ctx, { email: "f@aluno.test", name: "Forja" });
    const token = tokenFromLastEmail("f@aluno.test");
    const forged = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
    await expect(acceptInvite({ token: forged, password: PASSWORD, acceptTerms: "on" }, meta)).rejects.toBeInstanceOf(ValidationError);
    expect(await getInvitePreview({ token: "x".repeat(43) })).toBeNull();
  });

  it("não vaza usuários de outros tenants: convidar e-mail já cadastrado parece sucesso, mas não cria nada nem envia e-mail", async () => {
    const { a, b1 } = await twoTenants();
    const invitesBefore = await prisma.studentInvite.count();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: b1.ctx.userId } });
    const mailsBefore = emailsTo(user.email).length;

    await expect(inviteStudent(a.ctx, { email: user.email, name: "Roubo" })).resolves.toBeUndefined();

    expect(await prisma.studentInvite.count()).toBe(invitesBefore);
    expect(emailsTo(user.email).length).toBe(mailsBefore);
    expect((await prisma.tenantMember.findUniqueOrThrow({ where: { userId: user.id } })).tenantId).toBe(b1.ctx.tenantId);
  });

  it("limita convites por treinador (rate limit)", async () => {
    const a = await createCoach("rl");
    const results = [];
    for (let i = 0; i < 31; i++) {
      results.push(await inviteStudent(a.ctx, { email: `rl${i}@aluno.test`, name: "Aluno RL" }).then(() => "ok", (e) => e));
    }
    expect(results.slice(0, 30).every((r) => r === "ok")).toBe(true);
    expect(results[30]).toMatchObject({ code: "RATE_LIMITED" });
  });

  it("conflito explícito só aparece no aceite quando o e-mail virou conta no meio do caminho", async () => {
    const a = await createCoach("meio");
    await inviteStudent(a.ctx, { email: "meio@aluno.test", name: "Meio" });
    const token = tokenFromLastEmail("meio@aluno.test");
    await prisma.user.create({ data: { email: "meio@aluno.test", name: "Intruso" } });
    await expect(acceptInvite({ token, password: PASSWORD, acceptTerms: "on" }, meta)).rejects.toBeInstanceOf(ConflictError);
    // a transação foi revertida: o convite continua utilizável após resolver o conflito
    expect((await prisma.studentInvite.findFirstOrThrow()).status).toBe("PENDING");
  });
});
