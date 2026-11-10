import Link from "next/link";
import {
  Calendar,
  Copy,
  FileCheck2,
  FileEdit,
  Layers,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudentsForTenant } from "@/modules/students/service";
import {
  listProgramsForTenant,
  listWorkoutTemplatesForTenant,
} from "@/modules/workouts/service";
import { requireCoachContext } from "@/server/auth/session";
import { deleteTemplateAction } from "./actions";
import { CreateProgramForm } from "./create-program-form";

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">
          Editor de Treinos & Periodização
        </h1>
        <p className="text-sm text-[#9BA3AF]">
          Crie programas individualizados, organize divisões semanais, prescreva séries/cargas e publique versões imutáveis.
        </p>
      </div>

      {/* Create New Program Card */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-emerald-400" />
            Novo Programa de Treinamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateProgramForm
            students={studentOptions}
            defaultStudentId={params.studentProfileId}
          />
        </CardContent>
      </Card>

      {/* Active & Draft Programs Directory */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Programas de Treinamento ({programs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#242C3A] p-8 text-center">
              <p className="text-sm font-medium text-[#F3F5F7]">
                Nenhum programa de treinamento criado ainda
              </p>
              <p className="mt-1 text-xs text-[#9BA3AF]">
                Selecione um aluno acima para iniciar o primeiro programa e organizar os dias da semana.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => {
                const latestVersion = program.versions[0];
                const publishedVersion = program.versions.find(
                  (v) => v.status === "PUBLISHED"
                );
                const draftVersion = program.versions.find(
                  (v) => v.status === "DRAFT"
                );

                return (
                  <Link
                    key={program.id}
                    href={`/coach/workouts/${program.id}`}
                    className="flex flex-col gap-3 rounded-xl border border-[#242C3A]/80 bg-[#090B0E]/70 p-4 transition-colors hover:border-emerald-500/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-[#F3F5F7]">
                          {program.title}
                        </span>
                        {program.isActive ? (
                          <Badge variant="emerald" className="text-[10px]">
                            Programa Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Inativo
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-[#9BA3AF]">
                        Aluno:{" "}
                        <strong className="text-[#F3F5F7]">
                          {program.studentProfile.user.name ??
                            program.studentProfile.user.email}
                        </strong>
                        {program.goal ? ` • Foco: ${program.goal}` : ""}
                      </p>

                      {latestVersion && (
                        <p className="text-[11px] text-[#647082]">
                          {latestVersion.trainingDays.length} dias configurados •{" "}
                          {program.versions.length} versões no histórico
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {publishedVersion && (
                        <Badge variant="emerald" className="gap-1 text-[11px]">
                          <FileCheck2 className="h-3 w-3" />
                          Publicada v{publishedVersion.versionNumber}
                        </Badge>
                      )}
                      {draftVersion && (
                        <Badge variant="warning" className="gap-1 text-[11px]">
                          <FileEdit className="h-3 w-3" />
                          Rascunho v{draftVersion.versionNumber}
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" className="border-[#242C3A] text-xs">
                        Abrir Editor
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reusable Workout Templates */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <Copy className="h-4 w-4 text-emerald-400" />
            Templates Reutilizáveis do Estúdio ({templates.length})
          </CardTitle>
          <p className="text-xs text-[#9BA3AF]">
            Modelos salvos a partir de programas anteriores que podem ser importados com 1 clique em qualquer rascunho.
          </p>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#242C3A] p-6 text-center text-xs text-[#9BA3AF]">
              Nenhum template salvo ainda. Dentro do editor de qualquer programa, utilize a opção{" "}
              <strong className="text-[#F3F5F7]">Salvar como Template</strong> para reutilizar divisões de treino.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => {
                const daysArray = Array.isArray(tpl.templateData)
                  ? tpl.templateData
                  : [];
                return (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between rounded-lg border border-[#242C3A] bg-[#090B0E]/80 p-3.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-400" />
                        <p className="text-sm font-semibold text-[#F3F5F7]">
                          {tpl.title}
                        </p>
                      </div>
                      <p className="text-xs text-[#9BA3AF]">
                        {tpl.category ? `${tpl.category} • ` : ""}
                        {daysArray.length} dias de treino
                      </p>
                    </div>

                    <form action={deleteTemplateAction}>
                      <input type="hidden" name="templateId" value={tpl.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
