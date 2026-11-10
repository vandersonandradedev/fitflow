import { revokeSessionsAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireCoachContext } from "@/server/auth/session";
import { ChangePasswordForm } from "./password-form";

export default async function CoachSettingsPage() {
  await requireCoachContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segurança e sessões"
        description="Altere sua senha ou encerre sessões ativas em todos os dispositivos."
      />

      <div className="max-w-2xl divide-y divide-border rounded-lg border border-border bg-card">
        <section className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Alterar senha</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ao alterar a senha, todas as sessões anteriores serão revogadas automaticamente.
            </p>
          </div>
          <ChangePasswordForm />
        </section>

        <section className="p-5 sm:p-6 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Revogar todas as sessões
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Incrementa a versão de sessão da sua conta, desconectando imediatamente qualquer navegador ou dispositivo autenticado.
            </p>
          </div>
          <form action={revokeSessionsAction}>
            <Button type="submit" variant="destructive" size="sm">
              Encerrar sessões em todos os dispositivos
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
