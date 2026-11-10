"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  if (state.ok && state.message) {
    return (
      <div className="space-y-4 py-2 text-center">
        <CheckCircle2 className="mx-auto h-7 w-7 text-primary" />
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-foreground">Verifique seu e-mail</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{state.message}</p>
        </div>
        <Link href="/login" className="block">
          <Button variant="outline" className="w-full">
            Ir para o Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3.5">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs font-medium text-foreground">
          Seu Nome Completo
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          placeholder="Ex: Lucas Ferreira"
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="tenantName" className="text-xs font-medium text-foreground">
          Nome da sua Marca / Studio
        </Label>
        <Input
          id="tenantName"
          name="tenantName"
          type="text"
          required
          minLength={2}
          maxLength={120}
          placeholder="Ex: Lucas Ferreira Consultoria"
        />
        {state.fieldErrors?.tenantName?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.tenantName[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs font-medium text-foreground">
          E-mail Profissional
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="lucas@exemplo.com"
        />
        {state.fieldErrors?.email?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="text-xs font-medium text-foreground">
          Criar Senha Segura
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          placeholder="Mínimo 10 caracteres"
        />
        {state.fieldErrors?.password?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <label className="flex items-start gap-2.5 pt-1 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          name="acceptTerms"
          value="on"
          required
          className="mt-0.5 h-4 w-4 rounded border-border bg-background accent-emerald-500"
        />
        <span>Concordo com os Termos de Uso e Política de Privacidade (LGPD).</span>
      </label>
      {state.fieldErrors?.acceptTerms?.[0] && (
        <p className="text-[11px] text-red-400">{state.fieldErrors.acceptTerms[0]}</p>
      )}

      <div className="flex items-start gap-2 pt-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <span>
          Ao criar seu cadastro, você recebe um tenant independente e isolado conforme as diretrizes da LGPD.
        </span>
      </div>

      <Button type="submit" disabled={pending} className="w-full h-10 mt-1">
        {pending ? "Criando ambiente..." : "Criar meu Ambiente FitFlow"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
