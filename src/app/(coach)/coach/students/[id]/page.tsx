import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { formatBrazilDate } from "@/lib/date";
import { getStudentForTenant } from "@/modules/students/service";
import { listProgramsForTenant } from "@/modules/workouts/service";
import { NotFoundError } from "@/server/errors";
import { requireCoachContext } from "@/server/auth/session";
import { EditStudentForm } from "./edit-student-form";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireCoachContext();
  const { id } = await params;

  const student = await getStudentForTenant(ctx, id).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  const programs = await listProgramsForTenant(ctx, {
    studentProfileId: student.id,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        backHref="/coach/students"
        backLabel="Voltar para Alunos"
        title={student.user.name ?? "Aluno"}
        description={`${student.user.email} · Cadastrado em ${formatBrazilDate(
          student.createdAt
        )}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/coach/progress?studentProfileId=${student.id}`}>
              <Button variant="outline" size="sm">
                Ver evolução
              </Button>
            </Link>
            <Link href={`/coach/workouts?studentProfileId=${student.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo programa
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Profile Form (2 cols) */}
        <section className="lg:col-span-2 rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Dados cadastrais e anamnese
          </h2>
          <EditStudentForm
            student={{
              id: student.id,
              status: student.status,
              phone: student.phone,
              birthDate: student.birthDate
                ? new Date(student.birthDate).toISOString().slice(0, 10)
                : null,
              fitnessGoal: student.fitnessGoal,
              experienceLevel: student.experienceLevel,
              trainerNotes: student.trainerNotes,
              healthConditions: student.healthConditions,
            }}
          />
        </section>

        {/* Assigned Programs (1 col) */}
        <aside className="rounded-lg border border-border bg-card overflow-hidden self-start">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold text-foreground">
              Programas de treino ({programs.length})
            </h2>
          </div>

          {programs.length === 0 ? (
            <p className="p-5 text-xs text-muted-foreground">
              Nenhum programa prescrito para este aluno ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {programs.map((prog) => {
                const latest = prog.versions[0];
                return (
                  <li key={prog.id}>
                    <Link
                      href={`/coach/workouts/${prog.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs transition-colors hover:bg-secondary/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{prog.title}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {latest
                            ? `v${latest.versionNumber} (${latest.status}) · ${latest.trainingDays.length} dias`
                            : "Sem versões"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={prog.isActive ? "emerald" : "secondary"}>
                          {prog.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
