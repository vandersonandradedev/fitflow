import Link from "next/link";
import { getInvitePreview } from "@/modules/students/invites";
import { Button } from "@/components/ui/button";
import { AuthFrame } from "../../auth-frame";
import { AcceptInviteForm } from "./accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getInvitePreview({ token });

  return (
    <AuthFrame
      title={preview ? `Olá, ${preview.studentName}!` : "Convite inválido ou expirado"}
      description={
        preview
          ? `${preview.tenantName} convidou você para acompanhar seus treinos no FitFlow.`
          : "Este convite já foi utilizado, expirou ou foi revogado pelo treinador."
      }
    >
      {preview ? (
        <AcceptInviteForm token={token} />
      ) : (
        <Link href="/login" className="block">
          <Button variant="outline" className="w-full">
            Ir para o Login
          </Button>
        </Link>
      )}
    </AuthFrame>
  );
}
