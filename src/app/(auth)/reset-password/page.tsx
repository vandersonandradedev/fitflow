import Link from "next/link";
import { AuthFrame } from "../auth-frame";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthFrame
      title="Redefinir Senha"
      description="Defina uma nova senha segura. Todas as sessões anteriores serão encerradas."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar ao Login
        </Link>
      }
    >
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className="text-center text-xs text-red-400">
          Link de redefinição ausente ou inválido.
        </p>
      )}
    </AuthFrame>
  );
}
