"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Dumbbell, History, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { FitFlowLogo } from "@/components/ui/logo";

interface StudentShellProps {
  tenantName: string;
  initial: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

const STUDENT_TABS = [
  { href: "/student/today", label: "Hoje", icon: Dumbbell },
  { href: "/student/week", label: "Semana", icon: Calendar },
  { href: "/student/history", label: "Histórico", icon: History },
  { href: "/student/profile", label: "Perfil", icon: User },
];

export function StudentShell({
  tenantName,
  initial,
  logoutAction,
  children,
}: StudentShellProps) {
  const pathname = usePathname();

  const isTabActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/student/today" && pathname.startsWith("/student/session"));

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Top Bar com Safe Area para Notch / Ilha Dinâmica */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 pt-safe">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/student/today" className="flex items-center shrink-0 group transition-transform group-hover:scale-105 active:scale-95">
            <FitFlowLogo size="sm" priority />
          </Link>

          {/* Desktop/Tablet Inline Navigation */}
          <nav
            aria-label="Navegação do Aluno"
            className="hidden md:flex items-center gap-1"
          >
            {STUDENT_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    active
                      ? "bg-secondary text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="truncate text-xs text-muted-foreground max-w-[130px] sm:max-w-[180px]">
              {tenantName}
            </span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-foreground ring-1 ring-border">
              {initial}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Sair"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 min-w-0 px-4 pt-4 pb-24 sm:px-6 sm:pt-6 md:pb-10">
        {children}
      </main>

      {/* Bottom Ergonomic Navigation Bar for Gym Mobile Use (estilo App Nativo) */}
      <nav
        aria-label="Menu inferior do aluno"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/90 pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.4)] select-none"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-4 items-center">
          {STUDENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center transition-all duration-150 touch-manipulation select-none active:scale-90",
                  active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground active:text-foreground"
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-5 right-5 h-0.5 rounded-b bg-primary shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-transform", active && "scale-105 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]")} />
                <span className="mt-1 text-[11px] font-medium tracking-tight">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
