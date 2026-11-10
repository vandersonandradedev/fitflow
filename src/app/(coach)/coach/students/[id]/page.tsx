import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStudentForTenant } from "@/modules/students/service";
import { listProgramsForTenant } from "@/modules/workouts/service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/coach/students"
          className="inline-flex items-center gap-1.5 text-xs text-[#9BA3AF] hover:text-[#F3F5F7]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Alunos
        </Link>

        <Link href={`/coach/workouts?studentProfileId=${student.id}`}>
          <Button size="sm" className="gap-1.5 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Novo Programa para {student.user.name ?? "Aluno"}
          </Button>
        </Link>
      </div>

      {/* Student Programs Card */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Programas de Treinamento ({programs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <p className="text-xs text-[#9BA3AF]">
              Nenhum programa prescrito para este aluno ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {programs.map((prog) => {
                const latest = prog.versions[0];
                return (
                  <Link
                    key={prog.id}
                    href={`/coach/workouts/${prog.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#242C3A] bg-[#090B0E]/70 p-3 text-xs hover:border-emerald-500/40"
                  >
                    <div>
                      <p className="font-semibold text-[#F3F5F7]">{prog.title}</p>
                      <p className="text-[#9BA3AF]">
                        {latest
                          ? `v${latest.versionNumber} (${latest.status}) • ${latest.trainingDays.length} dias`
                          : "Sem versões"}
                      </p>
                    </div>
                    <Badge variant={prog.isActive ? "emerald" : "secondary"}>
                      {prog.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#F3F5F7]">
            {student.user.name ?? "Aluno"}
          </CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            {student.user.email} • Cadastrado em{" "}
            {new Date(student.createdAt).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>

        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
