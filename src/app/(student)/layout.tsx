import Link from "next/link";
import { Dumbbell, Calendar, History, User, LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { prisma } from "@/lib/db";
import { requireStudentContext } from "@/server/auth/session";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireStudentContext();

  const [tenant, studentUser] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: ctx.tenantId }, select: { name: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { name: true, email: true } }),
  ]);

  const initial = (studentUser.name ?? studentUser.email).substring(0, 1).toUpperCase();

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

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#9BA3AF] truncate max-w-[140px]">{tenant.name}</span>
          <div className="h-7 w-7 rounded-full bg-[#1D2430] border border-[#242C3A] flex items-center justify-center text-xs font-semibold text-emerald-400">
            {initial}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Sair"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#9BA3AF] hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
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
