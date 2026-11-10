import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStudentForTenant } from "@/modules/students/service";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/coach/students"
          className="inline-flex items-center gap-1.5 text-xs text-[#9BA3AF] hover:text-[#F3F5F7]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Alunos
        </Link>
      </div>

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
