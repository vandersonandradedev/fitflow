import Link from "next/link";
import { ChevronRight, FileCheck2, FileEdit, Layers, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listStudentsForTenant } from "@/modules/students/service";
import {
  listProgramsForTenant,
  listWorkoutTemplatesForTenant,
} from "@/modules/workouts/service";
import { requireCoachContext } from "@/server/auth/session";
import { deleteTemplateAction } from "./actions";
import { CreateProgramDialog } from "./create-program-form";

export default async function CoachWorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentProfileId?: string }>;
}) {
  const ctx = await requireCoachContext();
  const params = await searchParams;

  const [programs, students, templates] = await Promise.all([
    listProgramsForTenant(ctx, {
      studentProfileId: params.studentProfileId || undefined,
    }),
    listStudentsForTenant(ctx, { status: "ACTIVE" }),
    listWorkoutTemplatesForTenant(ctx),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.user.name ?? s.user.email,
    email: s.user.email,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Treinos e Periodização"
        description="Gerencie programas individualizados, organize divisões semanais e publique versões imutáveis."
        actions={
          <CreateProgramDialog
            students={studentOptions}
            defaultStudentId={params.studentProfileId}
            defaultOpen={Boolean(params.studentProfileId)}
          />
        }
      />

      {/* Programs List */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">
            Programas de treinamento ({programs.length})
          </h2>
        </div>

        {programs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Nenhum programa de treinamento criado ainda"
              description="Crie um programa no botão acima para organizar os dias da semana e prescrever séries ao aluno."
            />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Programa</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Estrutura</TableHead>
                    <TableHead>Versões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Editor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => {
                    const latestVersion = program.versions[0];
                    const publishedVersion = program.versions.find(
                      (v) => v.status === "PUBLISHED"
                    );
                    const draftVersion = program.versions.find(
                      (v) => v.status === "DRAFT"
                    );

                    return (
                      <TableRow key={program.id}>
                        <TableCell>
                          <Link
                            href={`/coach/workouts/${program.id}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {program.title}
                          </Link>
                          {program.goal && (
                            <p className="text-xs text-muted-foreground">{program.goal}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {program.studentProfile.user.name ??
                            program.studentProfile.user.email}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {latestVersion
                            ? `${latestVersion.trainingDays.length} dias · ${program.versions.length} ver.`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {publishedVersion && (
                              <Badge variant="emerald" className="gap-1">
                                <FileCheck2 className="h-3 w-3" />
                                v{publishedVersion.versionNumber}
                              </Badge>
                            )}
                            {draftVersion && (
                              <Badge variant="warning" className="gap-1">
                                <FileEdit className="h-3 w-3" />
                                Rascunho v{draftVersion.versionNumber}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={program.isActive ? "emerald" : "secondary"}>
                            {program.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/coach/workouts/${program.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Abrir
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List */}
            <ul className="divide-y divide-border/70 md:hidden">
              {programs.map((program) => {
                const latestVersion = program.versions[0];
                const publishedVersion = program.versions.find(
                  (v) => v.status === "PUBLISHED"
                );
                const draftVersion = program.versions.find(
                  (v) => v.status === "DRAFT"
                );
                return (
                  <li key={program.id}>
                    <Link
                      href={`/coach/workouts/${program.id}`}
                      className="block space-y-2 px-4 py-3.5 hover:bg-secondary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {program.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {program.studentProfile.user.name ??
                              program.studentProfile.user.email}
                          </p>
                        </div>
                        <Badge variant={program.isActive ? "emerald" : "secondary"}>
                          {program.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {latestVersion && (
                          <span className="font-mono tabular-nums">
                            {latestVersion.trainingDays.length} dias
                          </span>
                        )}
                        {publishedVersion && (
                          <Badge variant="emerald">
                            Publicada v{publishedVersion.versionNumber}
                          </Badge>
                        )}
                        {draftVersion && (
                          <Badge variant="warning">
                            Rascunho v{draftVersion.versionNumber}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* Reusable Workout Templates */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">
            Templates reutilizáveis do estúdio ({templates.length})
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Modelos salvos a partir de programas anteriores que podem ser importados em qualquer rascunho.
          </p>
        </div>

        {templates.length === 0 ? (
          <p className="px-5 py-6 text-xs text-muted-foreground">
            Nenhum template salvo ainda. Dentro do editor de qualquer programa, utilize a opção{" "}
            <strong className="text-foreground">Salvar como template</strong> para reutilizar divisões.
          </p>
        ) : (
          <ul className="divide-y divide-border/70">
            {templates.map((tpl) => {
              const daysArray = Array.isArray(tpl.templateData) ? tpl.templateData : [];
              return (
                <li
                  key={tpl.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {tpl.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tpl.category ? `${tpl.category} · ` : ""}
                        <span className="font-mono tabular-nums">{daysArray.length}</span> dias de treino
                      </p>
                    </div>
                  </div>

                  <form action={deleteTemplateAction}>
                    <input type="hidden" name="templateId" value={tpl.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir template ${tpl.title}`}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
