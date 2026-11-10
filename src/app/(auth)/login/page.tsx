import Link from "next/link";
import { AuthFrame } from "../auth-frame";
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
    <AuthFrame
      title="Acessar o FitFlow"
      description="Entre com suas credenciais de Personal Trainer ou Aluno"
      footer={
        <div className="space-y-2">
          <div>
            É Personal Trainer e quer começar?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Crie seu ambiente SaaS
            </Link>
          </div>
          <p className="text-[11px] text-brand-textMuted">
            Alunos devem utilizar o link de convite exclusivo enviado pelo seu treinador.
          </p>
        </div>
      }
    >
      <LoginForm banner={banner} />
    </AuthFrame>
  );
}
