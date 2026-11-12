"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function LoginForm({
  banner,
}: {
  banner?: string | null;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (formData: FormData) => {
    // Reseta timestamps de atividade ao iniciar login
    if (typeof window !== "undefined") {
      localStorage.setItem("fitflow_session_start", String(Date.now()));
      localStorage.setItem("fitflow_last_activity", String(Date.now()));
    }
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      {banner && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <span className="leading-relaxed">{banner}</span>
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-medium text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span className="leading-relaxed">{state.error}</span>
        </div>
      )}

      {/* Campo E-mail */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-medium text-foreground">
          E-mail de Acesso
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            className="h-11 pl-10 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {/* Campo Senha */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-medium text-foreground">
            Senha
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="h-11 pl-10 pr-11 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Indicador de Segurança de Sessão */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
        <ShieldCheck className="h-3.5 w-3.5 text-primary/70 shrink-0" />
        <span>Sessão protegida: encerramento automático após 30 min sem uso.</span>
      </div>

      {/* Botão de Envio */}
      <Button
        type="submit"
        disabled={pending}
        className="w-full h-11 text-sm font-semibold tracking-wide gap-2 shadow-md hover:shadow-primary/20 transition-all"
      >
        {pending ? "Entrando..." : "Entrar no FitFlow"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
