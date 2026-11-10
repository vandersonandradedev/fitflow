"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Dumbbell,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachShellProps {
  tenantName: string;
  coachLabel: string;
  initials: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/students", label: "Alunos", icon: Users },
  { href: "/coach/exercises", label: "Exercícios", icon: BookOpen },
  { href: "/coach/workouts", label: "Treinos", icon: Calendar },
  { href: "/coach/progress", label: "Evolução", icon: LineChart },
];

export function CoachShell({
  tenantName,
  coachLabel,
  initials,
  logoutAction,
  children,
}: CoachShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card">
      {/* Brand Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link href="/coach/dashboard" className="flex items-center gap-2 min-w-0">
          <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            FitFlow
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fechar menu"
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tenant Identity */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{tenantName}</p>
            <p className="truncate text-xs text-muted-foreground">{coachLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav aria-label="Navegação do Treinador" className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[40px] items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary"
                />
              )}
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border px-3 py-3 space-y-0.5">
        <Link
          href="/coach/settings"
          className={cn(
            "relative flex min-h-[40px] items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
            isActive("/coach/settings")
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          )}
        >
          {isActive("/coach/settings") && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary"
            />
          )}
          <Settings
            className={cn(
              "h-4 w-4 shrink-0",
              isActive("/coach/settings") ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span>Configurações</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex min-h-[40px] w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label="Menu lateral móvel"
            className="relative z-10 flex h-full w-64 max-w-[85vw] flex-col border-r border-border bg-card"
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:border-brand-borderStrong"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-foreground leading-tight">
                FitFlow
              </span>
              <span className="block truncate text-xs text-muted-foreground leading-tight">
                {tenantName}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-medium text-muted-foreground">
              {tenantName}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/coach/workouts"
              className="hidden sm:inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-borderStrong hover:text-foreground"
            >
              Editor de Treinos
            </Link>
            <Link
              href="/coach/students"
              className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand-borderStrong hover:bg-secondary"
            >
              Alunos
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
