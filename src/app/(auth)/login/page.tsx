import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; welcome?: string; verified?: string }>;
}) {
  const params = await searchParams;
  let banner: string | null = null;
  if (params.reset === "1") {
    banner = "Senha atualizada com sucesso. Entre com a nova senha.";
  } else if (params.welcome === "1") {
    banner = "Conta de aluno ativada! Entre com seu e-mail e a senha que você definiu.";
  } else if (params.verified === "1") {
    banner = "E-mail confirmado com sucesso! Agora você já pode entrar.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090B0E] p-4">
      <Card className="w-full max-w-md border-[#242C3A] bg-[#12161D] shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#F3F5F7]">Acessar o FitFlow</CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            Entre com suas credenciais de Personal Trainer ou Aluno
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LoginForm banner={banner} />
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-[#242C3A]/60 pt-4 text-center text-xs text-[#9BA3AF]">
          <div>
            É Personal Trainer e quer começar?{" "}
            <Link href="/register" className="font-semibold text-emerald-400 hover:underline">
              Crie seu ambiente SaaS
            </Link>
          </div>
          <p className="text-[11px] text-[#647082]">
            Alunos devem utilizar o link de convite exclusivo enviado pelo seu treinador.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
