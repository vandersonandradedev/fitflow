import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireStudentContext } from "@/server/auth/session";

const GOAL_LABELS: Record<string, string> = {
  HYPERTROPHY: "Hipertrofia",
  WEIGHT_LOSS: "Emagrecimento",
  STRENGTH: "Força",
  HEALTH: "Saúde & Bem-estar",
  REHABILITATION: "Reabilitação",
};

const EXP_LABELS: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

export default async function StudentProfilePage() {
  const ctx = await requireStudentContext();

  const [student, tenant] = await Promise.all([
    prisma.studentProfile.findFirstOrThrow({
      where: {
        id: ctx.studentProfileId,
        tenantId: ctx.tenantId,
      },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
      },
    }),
    prisma.tenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Meu perfil</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Informações cadastrais
        </h1>
      </div>

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary font-semibold text-sm text-primary">
            {(student.user.name ?? student.user.email)
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">
              {student.user.name ?? "Aluno"}
            </h2>
            <p className="truncate text-xs text-muted-foreground">{student.user.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-border/70 px-4 text-xs">
          <div className="flex items-center justify-between py-3">
            <dt className="text-muted-foreground">Estúdio / Personal trainer</dt>
            <dd className="font-medium text-primary">{tenant.name}</dd>
          </div>

          <div className="flex items-center justify-between py-3">
            <dt className="text-muted-foreground">Objetivo principal</dt>
            <dd>
              <Badge variant="outline">
                {GOAL_LABELS[student.fitnessGoal] ?? student.fitnessGoal}
              </Badge>
            </dd>
          </div>

          <div className="flex items-center justify-between py-3">
            <dt className="text-muted-foreground">Nível de experiência</dt>
            <dd className="font-medium text-foreground">
              {EXP_LABELS[student.experienceLevel] ?? student.experienceLevel}
            </dd>
          </div>

          {student.phone && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-muted-foreground">Telefone</dt>
              <dd className="font-mono tabular-nums text-foreground">{student.phone}</dd>
            </div>
          )}

          {student.birthDate && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-muted-foreground">Data de nascimento</dt>
              <dd className="font-mono tabular-nums text-foreground">
                {new Date(student.birthDate).toLocaleDateString("pt-BR")}
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <dt className="text-muted-foreground">Data de início</dt>
            <dd className="font-mono tabular-nums text-foreground">
              {new Date(student.createdAt).toLocaleDateString("pt-BR")}
            </dd>
          </div>
        </dl>

        {student.healthConditions && (
          <div className="border-t border-border p-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Restrições / observações de saúde
            </p>
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
              {student.healthConditions}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
