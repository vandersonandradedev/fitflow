import { Users, CheckCircle2, AlertTriangle, Trophy, Plus, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CoachDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">Dashboard do Treinador</h1>
          <p className="text-sm text-[#9BA3AF]">
            Visão geral de compliance, alunos ativos e treinos executados nesta semana.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-[#242C3A] hover:bg-[#1D2430]">
            Exportar Relatório
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-1.5">
            <Plus className="h-4 w-4" />
            Convidar Aluno
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#9BA3AF] uppercase tracking-wider">
              Total de Alunos
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F3F5F7]">28</div>
            <p className="text-xs text-[#9BA3AF] mt-1">
              <span className="text-emerald-400 font-medium">26 ativos</span> • 2 pausados
            </p>
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
            <div className="text-2xl font-bold text-[#F3F5F7]">74</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" />
              88% de taxa de conclusão
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#9BA3AF] uppercase tracking-wider">
              Alunos em Risco
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">3</div>
            <p className="text-xs text-[#9BA3AF] mt-1">
              Sem treinar há mais de 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[#9BA3AF] uppercase tracking-wider">
              Recordes Pessoais (PRs)
            </CardTitle>
            <Trophy className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F3F5F7]">12</div>
            <p className="text-xs text-emerald-400 mt-1 font-medium">
              Superados nos últimos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections: Recent Activity & Actionable Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Workouts Logged */}
        <Card className="lg:col-span-2 border-[#242C3A] bg-[#12161D]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#F3F5F7]">
              Atividades Recentes dos Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Mariana Costa", workout: "Treino A - Peito e Tríceps", time: "Há 25 minutos", volume: "4.250 kg", rpe: "RPE 8" },
                { name: "Rodrigo Silveira", workout: "Treino C - Pernas Completo", time: "Há 1 hora", volume: "8.120 kg", rpe: "RPE 9" },
                { name: "Beatriz Lima", workout: "Treino B - Costas e Bíceps", time: "Há 3 horas", volume: "3.800 kg", rpe: "RPE 7.5" },
                { name: "Felipe Santos", workout: "Treino A - Peito e Tríceps", time: "Há 5 horas", volume: "5.100 kg", rpe: "RPE 8.5" },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-[#242C3A]/60 bg-[#090B0E]/60 p-3.5 hover:border-[#242C3A] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-xs border border-emerald-500/20">
                      {activity.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#F3F5F7]">{activity.name}</p>
                      <p className="text-xs text-[#9BA3AF]">{activity.workout}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant="emerald" className="text-[10px]">
                      {activity.volume}
                    </Badge>
                    <p className="text-[11px] text-[#647082] mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actionable Alerts & Inactive Students */}
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#F3F5F7]">
              Atenção Recomendada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              <p className="font-semibold mb-1">3 Alunos sem treino recente</p>
              <p className="text-amber-300/80">Envie um lembrete no WhatsApp para manter o engajamento e a retenção.</p>
            </div>

            <div className="space-y-2">
              {[
                { name: "Carlos Eduardo", days: 9 },
                { name: "Juliana Mendes", days: 8 },
                { name: "André Ramos", days: 7 },
              ].map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#090B0E]/40 border border-[#242C3A]/40 text-xs">
                  <span className="text-[#F3F5F7] font-medium">{student.name}</span>
                  <span className="text-amber-400 font-semibold">{student.days} dias parado</span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full text-xs border-[#242C3A] hover:bg-[#1D2430]">
              Ver Todos os Alunos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
