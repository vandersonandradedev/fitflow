import Link from "next/link";
import { FitFlowLogo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface AuthFrameProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sidePanel?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function AuthFrame({
  title,
  description,
  children,
  footer,
  sidePanel,
  badge,
  className,
}: AuthFrameProps) {
  const hasSidePanel = Boolean(sidePanel);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-8 sm:px-6 sm:py-12">
      {/* Luz ambiente de fundo (Glow sutil no topo) */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative z-10 w-full transition-all",
          hasSidePanel ? "max-w-5xl" : "max-w-lg"
        )}
      >
        {/* Logo superior para mobile ou telas sem sidePanel */}
        <div
          className={cn(
            "mb-6 flex items-center justify-center",
            hasSidePanel && "lg:hidden"
          )}
        >
          <Link
            href="/"
            className="inline-flex items-center text-foreground transition-transform hover:scale-105"
          >
            <FitFlowLogo size="md" priority />
          </Link>
        </div>

        {hasSidePanel ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-8">
            {/* Painel lateral (Desktop) */}
            <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-between rounded-2xl border border-primary/20 bg-gradient-to-b from-card via-card/90 to-card/60 p-8 shadow-xl backdrop-blur-sm">
              {sidePanel}
            </div>

            {/* Painel do Formulário */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8 md:p-10">
                <div className="space-y-2">
                  {badge && <div className="mb-1">{badge}</div>}
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {title}
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>

                <div className="mt-6 sm:mt-8">{children}</div>

                {footer && (
                  <div className="mt-8 border-t border-border/80 pt-5 text-center text-xs text-muted-foreground">
                    {footer}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Formulário centralizado de largura confortável */
          <div
            className={cn(
              "rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8 md:p-9",
              className
            )}
          >
            <div className="space-y-2 text-center sm:text-left">
              {badge && <div className="mb-1">{badge}</div>}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="mt-6 sm:mt-7">{children}</div>

            {footer && (
              <div className="mt-8 border-t border-border/80 pt-5 text-center text-xs text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
