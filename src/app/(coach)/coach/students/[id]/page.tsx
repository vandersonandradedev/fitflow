import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBrazilDate } from "@/lib/date";
import { getStudentForTenant } from "@/modules/students/service";
import { listProgramsForTenant } from "@/modules/workouts/service";
import { NotFoundError } from "@/server/errors";
import { requireCoachContext } from "@/server/auth/session";
import { EditStudentForm } from "./edit-student-form";
import { NudgeStudentDialog } from "./nudge-dialog";

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

  const studentInitials = (student.user.name ?? student.user.email ?? "A")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex items-center gap-4 min-w-0">
          {student.user.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={student.user.image}
              alt={student.user.name ?? "Aluno"}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/40 shrink-0 shadow-md"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-bold text-primary ring-2 ring-border">
              {studentInitials}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <Link
              href="/coach/students"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para Alunos
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl truncate">
              {student.user.name ?? "Aluno"}
            </h1>
            <p className="max-w-2xl text-xs text-muted-foreground truncate">
              {student.user.email} · Cadastrado em {formatBrazilDate(student.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <NudgeStudentDialog
            studentProfileId={student.id}
            studentName={student.user.name}
          />
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
      </div>

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
