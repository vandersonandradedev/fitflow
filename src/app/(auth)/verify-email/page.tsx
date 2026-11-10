import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { AuthFrame } from "../auth-frame";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailAction(token) : false;

  return (
    <AuthFrame
      title={verified ? "E-mail confirmado com sucesso!" : "Link inválido ou expirado"}
      description={
        verified
          ? "Sua conta está ativa. Agora você já pode acessar o FitFlow."
          : "Este link de confirmação já foi utilizado ou expirou."
      }
    >
      <div className="space-y-4 text-center">
        {verified ? (
          <CheckCircle2 className="mx-auto h-7 w-7 text-primary" />
        ) : (
          <XCircle className="mx-auto h-7 w-7 text-red-400" />
        )}
        <Link href={verified ? "/login?verified=1" : "/login"} className="block">
          <Button className="w-full h-10">Ir para o Login</Button>
        </Link>
      </div>
    </AuthFrame>
  );
}
