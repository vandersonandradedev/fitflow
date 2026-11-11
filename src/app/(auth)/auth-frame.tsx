import Link from "next/link";
import { FitFlowLogo } from "@/components/ui/logo";

interface AuthFrameProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthFrame({ title, description, children, footer }: AuthFrameProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center">
          <Link href="/" className="inline-flex items-center text-foreground transition-transform hover:scale-105">
            <FitFlowLogo size="md" priority />
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 sm:p-7">
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>

          <div className="mt-5">{children}</div>

          {footer && (
            <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
