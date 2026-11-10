import Link from "next/link";
import { Users, Mail, Search, X } from "lucide-react";
import { listPendingInvitesForTenant, listStudentsForTenant } from "@/modules/students/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireCoachContext } from "@/server/auth/session";
import { revokeInviteAction } from "./actions";
import { InviteStudentForm } from "./invite-form";

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
  searchParams: Promise<{ search?: string; status?: string }>;
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">Gestão de Alunos</h1>
        <p className="text-sm text-[#9BA3AF]">
          Convide novos alunos, consulte perfis individuais e gerencie o status de acompanhamento.
        </p>
      </div>

      {/* Invite Student Card */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7]">
            Convidar Novo Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InviteStudentForm />
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-400" />
              Convites Pendentes ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-[#242C3A]/60 bg-[#090B0E]/60 p-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#F3F5F7]">{invite.name}</p>
                    <p className="text-[#9BA3AF]">
                      {invite.email} • Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      Revogar
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Directory */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Alunos Cadastrados ({students.length})
          </CardTitle>

          <form method="GET" className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#647082]" />
              <Input
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Buscar nome ou e-mail..."
                className="h-9 w-56 pl-8 bg-[#090B0E] border-[#242C3A] text-xs"
              />
            </div>
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="h-9 rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 text-xs text-[#F3F5F7]"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="PAUSED">Pausados</option>
              <option value="ARCHIVED">Arquivados</option>
            </select>
            <Button type="submit" variant="outline" size="sm" className="border-[#242C3A]">
              Filtrar
            </Button>
          </form>
        </CardHeader>

        <CardContent>
          {students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#242C3A] p-8 text-center">
              <p className="text-sm font-medium text-[#F3F5F7]">Nenhum aluno encontrado</p>
              <p className="mt-1 text-xs text-[#9BA3AF]">
                Envie um convite acima para que seu aluno crie a senha e acesse a plataforma.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {students.map((student) => {
                const statusMeta = STATUS_LABELS[student.status] ?? {
                  label: student.status,
                  variant: "secondary" as const,
                };
                return (
                  <Link
                    key={student.id}
                    href={`/coach/students/${student.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#242C3A]/60 bg-[#090B0E]/60 p-3.5 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-xs border border-emerald-500/20">
                        {(student.user.name ?? student.user.email).substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#F3F5F7]">
                          {student.user.name ?? "Sem nome"}
                        </p>
                        <p className="text-xs text-[#9BA3AF]">
                          {student.user.email}
                          {student.phone ? ` • ${student.phone}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px] hidden sm:inline-flex">
                        {GOAL_LABELS[student.fitnessGoal] ?? student.fitnessGoal}
                      </Badge>
                      <Badge variant={statusMeta.variant} className="text-[11px]">
                        {statusMeta.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
