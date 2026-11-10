import Link from "next/link";
import { AuthFrame } from "../auth-frame";
import { ForgotForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      title="Recuperar Senha"
      description="Informe seu e-mail para receber um link de redefinição de uso único (válido por 1 hora)"
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar ao Login
        </Link>
      }
    >
      <ForgotForm />
    </AuthFrame>
  );
}
