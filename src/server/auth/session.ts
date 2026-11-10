import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { assertCoach, assertStudent, resolveTenantContext, type TenantContext } from "./context";
import { UnauthorizedError } from "@/server/errors";

/**
 * Único ponto de entrada para obter a identidade nas camadas web. Lê a sessão assinada e valida no
 * banco (vínculo, tenant ativo, sessão não revogada). `cache` deduplica dentro de uma requisição.
 */
export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const session = await auth();
  if (!session?.user?.id || session.sessionVersion < 0) throw new UnauthorizedError();
  return resolveTenantContext(session.user.id, session.sessionVersion);
});

/** Para páginas/layouts do treinador: redireciona em vez de lançar. */
export async function requireCoachContext(): Promise<TenantContext> {
  const ctx = await getTenantContext().catch(() => redirect("/login"));
  if (ctx.role === "STUDENT") redirect("/student/today");
  assertCoach(ctx);
  return ctx;
}

/** Para páginas/layouts do aluno. */
export async function requireStudentContext() {
  const ctx = await getTenantContext().catch(() => redirect("/login"));
  if (ctx.role !== "STUDENT") redirect("/coach/dashboard");
  assertStudent(ctx);
  return ctx;
}
