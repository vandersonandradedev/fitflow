import Link from "next/link";
import { Dumbbell, LayoutDashboard, Users, BookOpen, Calendar, LineChart, Settings, LogOut, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#090B0E] text-[#F3F5F7]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-[#242C3A] bg-[#090B0E] md:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2 border-b border-[#242C3A] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#F3F5F7]">
            Fit<span className="text-emerald-400">Flow</span>
          </span>
          <Badge variant="emerald" className="ml-auto text-[10px] py-0 px-1.5">
            PRO
          </Badge>
        </div>

        {/* Coach Tenant Switcher / Profile Badge */}
        <div className="border-b border-[#242C3A] p-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#12161D] p-2.5 border border-[#242C3A]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs">
              TR
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-[#F3F5F7]">Studio Personal</p>
              <p className="truncate text-xs text-[#9BA3AF]">Lucas Treinador</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/coach/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <Link
            href="/coach/students"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#9BA3AF] hover:bg-[#12161D] hover:text-[#F3F5F7] transition-colors"
          >
            <Users className="h-4 w-4" />
            Alunos
          </Link>

          <Link
            href="/coach/exercises"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#9BA3AF] hover:bg-[#12161D] hover:text-[#F3F5F7] transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Exercícios
          </Link>

          <Link
            href="/coach/workouts"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#9BA3AF] hover:bg-[#12161D] hover:text-[#F3F5F7] transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Editor de Treinos
          </Link>

          <Link
            href="/coach/progress"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#9BA3AF] hover:bg-[#12161D] hover:text-[#F3F5F7] transition-colors"
          >
            <LineChart className="h-4 w-4" />
            Evolução
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[#242C3A] p-4 space-y-1">
          <Link
            href="/coach/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#9BA3AF] hover:bg-[#12161D] hover:text-[#F3F5F7] transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#EF4444] hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-[#242C3A] bg-[#090B0E]/80 backdrop-blur-md px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-bold text-[#F3F5F7]">Fit<span className="text-emerald-400">Flow</span></span>
          </div>

          <div className="hidden md:block">
            <span className="text-xs uppercase tracking-wider text-[#647082] font-semibold">
              Ambiente do Treinador • Tenant Ativo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Notificações"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#242C3A] bg-[#12161D] text-[#9BA3AF] hover:text-[#F3F5F7]"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500"></span>
            </button>
            <Link
              href="/"
              className="text-xs text-[#9BA3AF] hover:text-[#F3F5F7] border border-[#242C3A] px-2.5 py-1.5 rounded-md bg-[#12161D]"
            >
              Voltar ao Início
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
