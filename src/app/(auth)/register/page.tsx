import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

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

        <CardContent>
          <RegisterForm />
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
