import Link from "next/link";
import { AuthFrame } from "../auth-frame";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthFrame
      title="Criar Conta de Treinador"
      description="Configure seu ambiente SaaS independente e comece a gerenciar seus alunos"
      footer={
        <div>
          Já possui uma conta de treinador?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Fazer Login
          </Link>
        </div>
      }
    >
      <RegisterForm />
    </AuthFrame>
  );
}
