import Link from "next/link";
import { Dumbbell, Calendar, History, User } from "lucide-react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#090B0E] text-[#F3F5F7] max-w-lg mx-auto border-x border-[#242C3A]/40 shadow-2xl">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#242C3A] bg-[#090B0E]/95 backdrop-blur-md px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-sm text-[#F3F5F7]">
            Fit<span className="text-emerald-400">Flow</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9BA3AF]">Lucas Treinador</span>
          <div className="h-7 w-7 rounded-full bg-[#1D2430] border border-[#242C3A] flex items-center justify-center text-xs font-semibold text-emerald-400">
            M
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 p-4">
        {children}
      </main>

      {/* Bottom Ergonomic Navigation Bar for Gym Use (Min 48px Touch Targets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#242C3A] bg-[#090B0E]/95 backdrop-blur-md max-w-lg mx-auto">
        <div className="grid h-16 grid-cols-4 items-center">
          <Link
            href="/student/today"
            className="flex flex-col items-center justify-center h-full text-emerald-400 transition-colors"
          >
            <Dumbbell className="h-5 w-5" />
            <span className="text-[11px] font-medium mt-1">Hoje</span>
          </Link>

          <Link
            href="/student/week"
            className="flex flex-col items-center justify-center h-full text-[#9BA3AF] hover:text-[#F3F5F7] transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[11px] font-medium mt-1">Semana</span>
          </Link>

          <Link
            href="/student/history"
            className="flex flex-col items-center justify-center h-full text-[#9BA3AF] hover:text-[#F3F5F7] transition-colors"
          >
            <History className="h-5 w-5" />
            <span className="text-[11px] font-medium mt-1">Histórico</span>
          </Link>

          <Link
            href="/student/profile"
            className="flex flex-col items-center justify-center h-full text-[#9BA3AF] hover:text-[#F3F5F7] transition-colors"
          >
            <User className="h-5 w-5" />
            <span className="text-[11px] font-medium mt-1">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
