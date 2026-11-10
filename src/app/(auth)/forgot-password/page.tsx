import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090B0E] p-4">
      <Card className="w-full max-w-md border-[#242C3A] bg-[#12161D] shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#F3F5F7]">Recuperar Senha</CardTitle>
          <CardDescription className="text-xs text-[#9BA3AF]">
            Informe seu e-mail para receber um link de redefinição de uso único (válido por 1 hora)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ForgotForm />
        </CardContent>

        <CardFooter className="flex justify-center border-t border-[#242C3A]/60 pt-4 text-xs text-[#9BA3AF]">
          <Link href="/login" className="text-emerald-400 hover:underline font-medium">
            Voltar ao Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
