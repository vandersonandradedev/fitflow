import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailAction(token) : false;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090B0E] p-4">
      <Card className="w-full max-w-md border-[#242C3A] bg-[#12161D] shadow-2xl text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
            {verified ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400" />
            )}
          </div>
          <CardTitle className="text-xl font-bold text-[#F3F5F7]">
            {verified ? "E-mail confirmado com sucesso!" : "Link inválido ou expirado"}
          </CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            {verified
              ? "Sua conta está ativa. Agora você já pode acessar o FitFlow."
              : "Este link de confirmação já foi utilizado ou expirou."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Link href={verified ? "/login?verified=1" : "/login"}>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold">
              Ir para o Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
