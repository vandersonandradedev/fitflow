import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Smartphone, Users } from "lucide-react";
import { auth } from "@/server/auth/auth";
import { resolveTenantContext } from "@/server/auth/context";
import { Button } from "@/components/ui/button";
import { FitFlowLogo, FitFlowIcon } from "@/components/ui/logo";

export default async function HomePage() {
  const session = await auth().catch(() => null);
  if (session?.user?.id && session.sessionVersion >= 0) {
    const ctx = await resolveTenantContext(session.user.id, session.sessionVersion).catch(() => null);
    if (ctx) {
      if (ctx.role === "STUDENT") redirect("/student/today");
      redirect("/coach/dashboard");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center min-w-0 transition-transform hover:scale-105">
            <FitFlowLogo size="sm" priority />
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Cadastrar Personal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="border-b border-border py-14 sm:py-20 lg:py-24">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-3xl space-y-5">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Prescrição de treinos e acompanhamento de alunos com precisão operacional.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Ambiente dedicado para personal trainers independentes estruturarem periodizações, acompanharem cargas e entregarem uma execução direta para o aluno na academia.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Link href="/coach/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Users className="h-4 w-4" />
                    Painel do Treinador
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/student/today" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Portal do Aluno
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Structured Product Capabilities */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
              <div className="py-6 md:pr-8">
                <h2 className="text-sm font-semibold text-foreground">
                  Ambiente isolado por treinador
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Cada consultoria opera em seu próprio espaço isolado, mantendo alunos, avaliações físicas e biblioteca personalizada sob controle exclusivo.
                </p>
              </div>

              <div className="py-6 md:px-8">
                <h2 className="text-sm font-semibold text-foreground">
                  Versionamento imutável de treinos
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Edite rascunhos sem interferir no histórico executado. Publicações novas mantêm registros anteriores de séries e cargas preservados.
                </p>
              </div>

              <div className="py-6 md:pl-8">
                <h2 className="text-sm font-semibold text-foreground">
                  Execução mobile na academia
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Controles táteis amplos, referência da sessão anterior em cada série, cronômetro de descanso integrado e persistência local imediata.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-xs text-brand-textMuted">
        <div className="container mx-auto flex max-w-5xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <FitFlowIcon size="sm" />
            <span>© {new Date().getFullYear()} FitFlow</span>
          </div>
          <span>Plataforma de gestão e execução de treinamento físico</span>
        </div>
      </footer>
    </div>
  );
}
