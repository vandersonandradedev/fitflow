import Link from "next/link";
import { Dumbbell, XCircle } from "lucide-react";
import { getInvitePreview } from "@/modules/students/invites";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInviteForm } from "./accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getInvitePreview({ token });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090B0E] p-4">
      <Card className="w-full max-w-md border-[#242C3A] bg-[#12161D] shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {preview ? <Dumbbell className="h-6 w-6" /> : <XCircle className="h-6 w-6 text-red-400" />}
          </div>
          <CardTitle className="text-xl font-bold text-[#F3F5F7]">
            {preview ? `Olá, ${preview.studentName}!` : "Convite inválido ou expirado"}
          </CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            {preview
              ? `${preview.tenantName} convidou você para acompanhar seus treinos no FitFlow.`
              : "Este convite já foi utilizado, expirou ou foi revogado pelo treinador."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {preview ? (
            <AcceptInviteForm token={token} />
          ) : (
            <Link href="/login">
              <Button variant="outline" className="w-full border-[#242C3A] hover:bg-[#1D2430]">
                Ir para o Login
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
