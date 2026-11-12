import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";
import { listPendingInvitesForTenant, listStudentsForTenant } from "@/modules/students/service";
import { formatBrazilDate } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireCoachContext } from "@/server/auth/session";
import { revokeInviteAction } from "./actions";
import { InviteStudentDialog } from "./invite-form";

const GOAL_LABELS: Record<string, string> = {
  HYPERTROPHY: "Hipertrofia",
  WEIGHT_LOSS: "Emagrecimento",
  STRENGTH: "Força",
  HEALTH: "Saúde",
  REHABILITATION: "Reabilitação",
};

const STATUS_LABELS: Record<string, { label: string; variant: "emerald" | "warning" | "secondary" }> = {
  ACTIVE: { label: "Ativo", variant: "emerald" },
  PAUSED: { label: "Pausado", variant: "warning" },
  ARCHIVED: { label: "Arquivado", variant: "secondary" },
};

export default async function CoachStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; invite?: string }>;
}) {
  const ctx = await requireCoachContext();
  const params = await searchParams;
  const statusFilter =
    params.status === "ACTIVE" || params.status === "PAUSED" || params.status === "ARCHIVED"
      ? params.status
      : undefined;

  const [students, pendingInvites] = await Promise.all([
    listStudentsForTenant(ctx, { search: params.search, status: statusFilter }),
    listPendingInvitesForTenant(ctx),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alunos"
        description="Gerencie cadastros ativos, status de acompanhamento e convites pendentes."
        actions={<InviteStudentDialog defaultOpen={params.invite === "1"} />}
      />

      {/* Pending Invites (Compact hairline strip only when present) */}
      {pendingInvites.length > 0 && (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="text-xs font-semibold text-foreground">
              Convites pendentes ({pendingInvites.length})
            </h2>
          </div>
          <ul className="divide-y divide-border/70">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-2 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{invite.name}</span>
                  <span className="mx-2 text-brand-textMuted">·</span>
                  <span className="text-muted-foreground">{invite.email}</span>
                  <span className="ml-2 font-mono text-[11px] tabular-nums text-brand-textMuted">
                    Expira {formatBrazilDate(invite.expiresAt)}
                  </span>
                </div>
                <form action={revokeInviteAction} className="shrink-0 self-end sm:self-auto">
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <X className="h-3.5 w-3.5" />
                    Revogar
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Search & Filter Toolbar */}
      <form
        method="GET"
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-textMuted" />
          <Input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Buscar nome ou e-mail..."
            className="pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            name="status"
            defaultValue={statusFilter ?? ""}
            aria-label="Filtrar por status"
            className="w-40 text-xs"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="PAUSED">Pausados</option>
            <option value="ARCHIVED">Arquivados</option>
          </Select>
          <Button type="submit" variant="outline" size="sm" className="h-9">
            Filtrar
          </Button>
        </div>
      </form>

      {/* Students Table / Mobile List */}
      {students.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          description="Ajuste os filtros ou convide um novo aluno para que ele ative o acesso ao portal."
        />
      ) : (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-2.5 text-xs font-medium text-muted-foreground">
            {students.length} {students.length === 1 ? "aluno cadastrado" : "alunos cadastrados"}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Aluno</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const statusMeta = STATUS_LABELS[student.status] ?? {
                    label: student.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Link
                          href={`/coach/students/${student.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {student.user.name ?? "Sem nome"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span>{student.user.email}</span>
                        {student.phone && (
                          <span className="block font-mono text-[11px] tabular-nums text-brand-textMuted">
                            {student.phone}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {GOAL_LABELS[student.fitnessGoal] ?? student.fitnessGoal}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/coach/students/${student.id}`}
                          aria-label={`Abrir perfil de ${student.user.name ?? student.user.email}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
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
            {students.map((student) => {
              const statusMeta = STATUS_LABELS[student.status] ?? {
                label: student.status,
                variant: "secondary" as const,
              };
              return (
                <li key={student.id}>
                  <Link
                    href={`/coach/students/${student.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {student.user.name ?? "Sem nome"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.user.email}
                      </p>
                      <p className="mt-0.5 text-[11px] text-brand-textMuted">
                        {GOAL_LABELS[student.fitnessGoal] ?? student.fitnessGoal}
                      </p>
                    </div>
                    <Badge variant={statusMeta.variant} className="shrink-0">
                      {statusMeta.label}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
