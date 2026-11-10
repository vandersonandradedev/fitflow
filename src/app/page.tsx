import Link from "next/link";
import { Dumbbell, ShieldCheck, Flame, Users, Calendar, ArrowRight, Activity, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090B0E] text-[#F3F5F7]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#242C3A] bg-[#090B0E]/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#F3F5F7]">
              Fit<span className="text-emerald-400">Flow</span>
            </span>
            <Badge variant="emerald" className="ml-2 hidden sm:inline-flex text-[10px]">
              SaaS Multi-Tenant
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[#9BA3AF] hover:text-[#F3F5F7]">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold">
                Cadastrar Personal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="container mx-auto max-w-5xl px-4 text-center sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 mb-6">
              <Flame className="h-3.5 w-3.5" />
              <span>Prescrição veloz, execução precisa, isolamento total</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[#F3F5F7]">
              A plataforma definitiva para <br className="hidden sm:inline" />
              <span className="text-emerald-400">Personal Trainers independentes</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9BA3AF] leading-relaxed">
              Prescreva fichas de musculação em minutos, acompanhe a execução dos seus alunos em tempo real e proporcione uma experiência mobile de elite na academia.
            </p>

            {/* Quick Access CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/coach/dashboard">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-2">
                  <Users className="h-4 w-4" />
                  Painel do Treinador
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/student/today">
                <Button size="lg" variant="outline" className="border-[#242C3A] hover:bg-[#1D2430] text-[#F3F5F7] gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  Portal do Aluno (Mobile)
                </Button>
              </Link>
            </div>

            {/* Architectural Highlights */}
            <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
              <div className="rounded-xl border border-[#242C3A] bg-[#12161D] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[#F3F5F7]">Isolamento Multi-Tenant</h3>
                <p className="mt-1 text-sm text-[#9BA3AF]">
                  Cada personal possui seu próprio inquilino criptografado no Neon PostgreSQL com zero risco de vazamento entre treinadores.
                </p>
              </div>

              <div className="rounded-xl border border-[#242C3A] bg-[#12161D] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[#F3F5F7]">Versionamento de Treinos</h3>
                <p className="mt-1 text-sm text-[#9BA3AF]">
                  Alterações futuras não corrompem treinos passados. Prescrição e histórico de execução são desacoplados e imutáveis.
                </p>
              </div>

              <div className="rounded-xl border border-[#242C3A] bg-[#12161D] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[#F3F5F7]">Execução em Academia</h3>
                <p className="mt-1 text-sm text-[#9BA3AF]">
                  Portal PWA mobile-first com cronômetro de descanso automático, alvos de toque amplos e persistência offline de séries.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#242C3A] bg-[#090B0E] py-8 text-center text-xs text-[#647082]">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} FitFlow SaaS — Engenharia Sênior de Software. Todos os direitos reservados.</p>
          <p className="mt-1">Inspirado nos melhores padrões de Trainerize, TrueCoach e Everfit.</p>
        </div>
      </footer>
    </div>
  );
}
