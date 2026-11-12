import Link from "next/link";
import {
  BellRing,
  Clock4,
  Dumbbell,
  Smartphone,
  Sparkles,
  Users2,
} from "lucide-react";
import { AuthFrame } from "../auth-frame";
import { LoginForm } from "./login-form";
import { FitFlowLogo } from "@/components/ui/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    reset?: string;
    welcome?: string;
    verified?: string;
    reason?: string;
  }>;
}) {
  const params = await searchParams;
  let banner: string | null = null;

  if (params.reset === "1") {
    banner = "Senha atualizada com sucesso. Entre com a nova senha.";
  } else if (params.welcome === "1") {
    banner = "Conta de aluno ativada! Entre com seu e-mail e a senha que você definiu.";
  } else if (params.verified === "1") {
    banner = "E-mail confirmado com sucesso! Agora você já pode entrar.";
  } else if (params.reason === "inactivity") {
    banner = "Sessão encerrada por inatividade (30 minutos sem uso). Faça login novamente para continuar.";
  } else if (params.reason === "expired") {
    banner = "Sessão expirada (limite máximo de 4 horas por sessão atingido). Faça login novamente.";
  }

  // Painel de destaque lateral para telas médias e grandes (Desktop/Tablet)
  const SidePanel = (
    <div className="flex h-full flex-col justify-between space-y-8">
      {/* Topo do Painel */}
      <div className="space-y-6">
        <Link href="/" className="inline-flex items-center transition-transform hover:scale-105">
          <FitFlowLogo size="md" priority />
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>FitFlow Web App</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Treinamento de alto nível, na palma da sua mão.
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Acesso unificado e seguro para Personal Trainers e seus Alunos.
          </p>
        </div>

        {/* Destaques estruturais */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-3.5 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Prescrição & Execução Direta
              </h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">
                Periodizações personalizadas, histórico de cargas e marcas pessoais (PRs) em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-3.5 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock4 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Cronômetro Radar & Modo Offline
              </h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">
                Alarme do timer estilo iPhone e funcionamento ininterrupto na academia, mesmo sem internet.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-3.5 backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Lembretes no Celular
              </h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground mt-0.5">
                Avisos automáticos de treinos, ingestão de água, alimentação e recuperação do sono.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Painel */}
      <div className="border-t border-border/60 pt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Smartphone className="h-3.5 w-3.5 text-primary" />
          Instalável no iPhone e Android
        </span>
        <span className="font-mono text-[10px] text-primary/80">PWA v3</span>
      </div>
    </div>
  );

  return (
    <AuthFrame
      title="Acessar o FitFlow"
      description="Entre com suas credenciais de Personal Trainer ou Aluno"
      badge={
        <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
          <Users2 className="h-3 w-3 text-primary" />
          <span>Portal Único</span>
        </div>
      }
      sidePanel={SidePanel}
      footer={
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            É Personal Trainer e quer começar?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              Crie seu ambiente
            </Link>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">É aluno?</span> O acesso é liberado através do link de convite enviado pelo seu treinador.
          </div>
        </div>
      }
    >
      <LoginForm banner={banner} />
    </AuthFrame>
  );
}
