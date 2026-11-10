import Link from "next/link";
import { Users, CheckCircle2, AlertTriangle, Calendar, Plus } from "lucide-react";
import { getCoachDashboard } from "@/modules/dashboard/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatWeight } from "@/lib/utils";
import { requireCoachContext } from "@/server/auth/session";

export default async function CoachDashboardPage() {
  const ctx = await requireCoachContext();
  const data = await getCoachDashboard(ctx);

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">Dashboard do Treinador</h1>
          <p className="text-sm text-[#9BA3AF]">
            Visão geral em tempo real dos seus alunos e treinos concluídos nesta semana.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/coach/students">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-1.5">
              <Plus className="h-4 w-4" />
              Convidar Aluno
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (100% Database-Backed) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#9BA3AF] uppercase tracking-wider">
              Total de Alunos
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F3F5F7]">{data.totalStudents}</div>
            <p className="text-xs text-[#9BA3AF] mt-1">
              <span className="text-emerald-400 font-medium">{data.activeStudents} ativos</span> •{" "}
              {data.pausedStudents} pausados
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#9BA3AF] uppercase tracking-wider">
              Programas Ativos
            </CardTitle>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F3F5F7]">{data.activePrograms}</div>
            <p className="text-xs text-[#9BA3AF] mt-1">Programas atribuídos no momento</p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#9BA3AF] uppercase tracking-wider">
              Treinos da Semana
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F3F5F7]">{data.sessionsThisWeek}</div>
            <p className="text-xs text-emerald-400 mt-1 font-medium">
              Sessões concluídas desde segunda-feira
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#9BA3AF] uppercase tracking-wider">
              Sem Atividade Recente
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{data.atRiskStudents.length}</div>
            <p className="text-xs text-[#9BA3AF] mt-1">Sem treinar há mais de 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections: Recent Activity & Actionable Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Workouts Logged */}
        <Card className="lg:col-span-2 border-[#242C3A] bg-[#12161D]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#F3F5F7]">
              Últimas Atividades dos Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#242C3A] p-8 text-center">
                <p className="text-sm font-medium text-[#F3F5F7]">Nenhum treino registrado ainda</p>
                <p className="mt-1 text-xs text-[#9BA3AF]">
                  Assim que seus alunos concluírem sessões de treino, elas aparecerão aqui em tempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg border border-[#242C3A]/60 bg-[#090B0E]/60 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-xs border border-emerald-500/20">
                        {activity.studentName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#F3F5F7]">{activity.studentName}</p>
                        <p className="text-xs text-[#9BA3AF]">{activity.workoutName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {activity.totalVolumeKg !== null && (
                        <Badge variant="emerald" className="text-[10px]">
                          {formatWeight(activity.totalVolumeKg)}
                        </Badge>
                      )}
                      {activity.completedAt && (
                        <p className="text-[11px] text-[#647082] mt-1">
                          {new Date(activity.completedAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Students */}
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#F3F5F7]">
              Alunos Sem Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.atRiskStudents.length === 0 ? (
              <p className="text-xs text-[#9BA3AF]">
                Nenhum aluno ativo está há mais de 7 dias sem registrar treino.
              </p>
            ) : (
              <div className="space-y-2">
                {data.atRiskStudents.map((student) => (
                  <Link
                    key={student.id}
                    href={`/coach/students/${student.id}`}
                    className="flex items-center justify-between p-2.5 rounded bg-[#090B0E]/40 border border-[#242C3A]/40 hover:border-[#242C3A] text-xs transition-colors"
                  >
                    <span className="text-[#F3F5F7] font-medium">{student.name}</span>
                    <span className="text-amber-400 font-semibold">&gt; 7 dias sem treino</span>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/coach/students" className="block">
              <Button variant="outline" className="w-full text-xs border-[#242C3A] hover:bg-[#1D2430]">
                Gerenciar Todos os Alunos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
