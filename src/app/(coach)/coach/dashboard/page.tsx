import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { getCoachDashboard } from "@/modules/dashboard/service";
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
import { formatWeight } from "@/lib/utils";
import { requireCoachContext } from "@/server/auth/session";

export default async function CoachDashboardPage() {
  const ctx = await requireCoachContext();
  const data = await getCoachDashboard(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard do Treinador"
        description="Acompanhe adesão semanal, sessões concluídas e alunos que precisam de contato."
        actions={
          <>
            <Link href="/coach/workouts">
              <Button variant="outline" size="sm">
                Novo programa
              </Button>
            </Link>
            <Link href="/coach/students?invite=1">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Convidar aluno
              </Button>
            </Link>
          </>
        }
      />

      {/* Unified Metrics Strip (No 4-card template bloat) */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-2 divide-y divide-border rounded-lg border border-border bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0"
      >
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Total de Alunos</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {data.totalStudents}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="text-primary font-medium">
              {data.activeStudents} {data.activeStudents === 1 ? "ativo" : "ativos"}
            </span>
            {" · "}
            {data.pausedStudents} {data.pausedStudents === 1 ? "pausado" : "pausados"}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Programas ativos</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {data.activePrograms}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Prescrições em andamento</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Treinos da Semana</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {data.sessionsThisWeek}
          </p>
          <p className="mt-1 text-xs text-primary font-medium">Concluídos desde segunda</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Precisam de atenção</p>
          <p
            className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${
              data.atRiskStudents.length > 0 ? "text-amber-400" : "text-foreground"
            }`}
          >
            {data.atRiskStudents.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Sem treino há mais de 7 dias</p>
        </div>
      </section>

      {/* Operational Split: Recent Sessions Table + Attention List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Workouts Table */}
        <section className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold text-foreground">
              Últimas atividades dos alunos
            </h2>
            <Link
              href="/coach/progress"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Ver evolução
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Nenhum treino registrado ainda"
                description="Assim que seus alunos concluírem sessões no portal mobile, o histórico aparecerá aqui."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Aluno</TableHead>
                  <TableHead>Treino</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium text-foreground">
                      {activity.studentName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.workoutName}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {activity.totalVolumeKg !== null ? (
                        <Badge variant="emerald">{formatWeight(activity.totalVolumeKg)}</Badge>
                      ) : (
                        <span className="text-brand-textMuted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                      {activity.completedAt
                        ? new Date(activity.completedAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* At-risk Students & Quick Links */}
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">
                Alunos sem atividade recente
              </h2>
              {data.atRiskStudents.length > 0 && (
                <Badge variant="warning" className="font-mono tabular-nums">
                  {data.atRiskStudents.length}
                </Badge>
              )}
            </div>

            {data.atRiskStudents.length === 0 ? (
              <p className="px-5 py-6 text-xs text-muted-foreground">
                Todos os alunos ativos registraram treino nos últimos 7 dias.
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {data.atRiskStudents.map((student) => (
                  <li key={student.id}>
                    <Link
                      href={`/coach/students/${student.id}`}
                      className="flex items-center justify-between gap-2 px-5 py-3 text-xs transition-colors hover:bg-secondary/40"
                    >
                      <span className="truncate font-medium text-foreground">
                        {student.name}
                      </span>
                      <span className="shrink-0 font-medium text-amber-400">
                        +7d sem treino
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-border px-5 py-3">
              <Link
                href="/coach/students"
                className="text-xs font-medium text-primary hover:underline"
              >
                Gerenciar todos os alunos
              </Link>
            </div>
          </section>

          {/* Operational Shortcuts */}
          <nav
            aria-label="Atalhos operacionais"
            className="rounded-lg border border-border bg-card divide-y divide-border/70"
          >
            <Link
              href="/coach/workouts"
              className="flex items-center justify-between px-5 py-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40"
            >
              <span>Prescrever ou editar treinos</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              href="/coach/exercises"
              className="flex items-center justify-between px-5 py-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40"
            >
              <span>Consultar biblioteca de exercícios</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
