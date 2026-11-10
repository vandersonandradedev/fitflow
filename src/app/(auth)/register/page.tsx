import Link from "next/link";
import { Dumbbell, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090B0E] p-4">
      <Card className="w-full max-w-md border-[#242C3A] bg-[#12161D] shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#F3F5F7]">Criar Conta de Treinador</CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            Configure seu ambiente SaaS independente e comece a gerenciar seus alunos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#F3F5F7]">Seu Nome Completo</label>
            <Input
              type="text"
              placeholder="Ex: Lucas Ferreira"
              className="bg-[#090B0E] border-[#242C3A]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#F3F5F7]">Nome da sua Marca / Studio</label>
            <Input
              type="text"
              placeholder="Ex: Lucas Ferreira Consultoria"
              className="bg-[#090B0E] border-[#242C3A]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#F3F5F7]">E-mail Profissional</label>
            <Input
              type="email"
              placeholder="lucas@exemplo.com"
              className="bg-[#090B0E] border-[#242C3A]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#F3F5F7]">Criar Senha Segura</label>
            <Input
              type="password"
              placeholder="Mínimo 8 caracteres"
              className="bg-[#090B0E] border-[#242C3A]"
            />
          </div>

          <div className="flex items-start gap-2 pt-1 text-[11px] text-[#9BA3AF]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Ao criar seu cadastro, você recebe um tenant independente e isolado conforme as diretrizes da LGPD.
            </span>
          </div>

          <Link href="/coach/dashboard">
            <Button className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-2">
              Criar meu Ambiente FitFlow
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-[#242C3A]/60 pt-4 text-center text-xs text-[#9BA3AF]">
          <div>
            Já possui uma conta de treinador?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
              Fazer Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
