import { Calendar, Dumbbell, ShieldCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <p className="text-xs text-[#9BA3AF]">Meu Perfil</p>
        <h1 className="text-xl font-bold tracking-tight text-[#F3F5F7]">
          Informações Cadastrais
        </h1>
      </div>

      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="p-4 pb-2 border-b border-[#242C3A]/60">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-lg border border-emerald-500/30">
              {(student.user.name ?? student.user.email)
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#F3F5F7]">
                {student.user.name ?? "Aluno"}
              </CardTitle>
              <p className="text-xs text-[#9BA3AF]">{student.user.email}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-[#242C3A]/40">
            <span className="text-[#9BA3AF]">Estúdio / Personal Trainer:</span>
            <span className="font-semibold text-emerald-400">{tenant.name}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#242C3A]/40">
            <span className="text-[#9BA3AF]">Objetivo Principal:</span>
            <Badge variant="outline" className="text-[11px]">
              {GOAL_LABELS[student.fitnessGoal] ?? student.fitnessGoal}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#242C3A]/40">
            <span className="text-[#9BA3AF]">Nível de Experiência:</span>
            <span className="font-semibold text-[#F3F5F7]">
              {EXP_LABELS[student.experienceLevel] ?? student.experienceLevel}
            </span>
          </div>

          {student.phone && (
            <div className="flex items-center justify-between py-1 border-b border-[#242C3A]/40">
              <span className="text-[#9BA3AF]">Telefone:</span>
              <span className="text-[#F3F5F7]">{student.phone}</span>
            </div>
          )}

          {student.birthDate && (
            <div className="flex items-center justify-between py-1 border-b border-[#242C3A]/40">
              <span className="text-[#9BA3AF]">Data de Nascimento:</span>
              <span className="text-[#F3F5F7]">
                {new Date(student.birthDate).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1 border-b border-[#242C3A]/40">
            <span className="text-[#9BA3AF]">Data de Início:</span>
            <span className="text-[#F3F5F7]">
              {new Date(student.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>

          {student.healthConditions && (
            <div className="pt-2">
              <span className="text-[#9BA3AF] block font-semibold mb-1">
                Restrições / Observações de Saúde:
              </span>
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-200">
                {student.healthConditions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
