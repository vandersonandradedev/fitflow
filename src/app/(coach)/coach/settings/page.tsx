import { ShieldAlert } from "lucide-react";
import { revokeSessionsAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCoachContext } from "@/server/auth/session";
import { ChangePasswordForm } from "./password-form";

export default async function CoachSettingsPage() {
  await requireCoachContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">Segurança e Sessões</h1>
        <p className="text-sm text-[#9BA3AF]">
          Altere sua senha ou encerre sessões ativas em todos os dispositivos.
        </p>
      </div>

      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#F3F5F7]">Alterar Senha</CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            Ao alterar a senha, todas as sessões anteriores serão revogadas automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Revogar Todas as Sessões
          </CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            Incrementa a versão de sessão da sua conta, desconectando imediatamente qualquer navegador ou dispositivo autenticado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={revokeSessionsAction}>
            <Button type="submit" variant="destructive">
              Encerrar Sessões em Todos os Dispositivos
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
