import Link from "next/link";
import { Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
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

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F3F5F7]">E-mail</label>
            <Input
              type="email"
              placeholder="seu.email@exemplo.com"
              className="bg-[#090B0E] border-[#242C3A]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#F3F5F7]">Senha</label>
              <Link href="#" className="text-xs text-emerald-400 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              className="bg-[#090B0E] border-[#242C3A]"
            />
          </div>

          <Link href="/coach/dashboard">
            <Button className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-2">
              Entrar na Plataforma
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
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
