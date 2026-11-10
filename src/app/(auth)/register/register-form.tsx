"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  if (state.ok && state.message) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-[#F3F5F7]">Verifique seu e-mail</h3>
          <p className="text-xs text-[#9BA3AF] leading-relaxed">{state.message}</p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full mt-2 border-[#242C3A] hover:bg-[#1D2430]">
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
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="text-xs font-semibold text-[#F3F5F7]">
          Seu Nome Completo
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          placeholder="Ex: Lucas Ferreira"
          className="bg-[#090B0E] border-[#242C3A]"
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="tenantName" className="text-xs font-semibold text-[#F3F5F7]">
          Nome da sua Marca / Studio
        </label>
        <Input
          id="tenantName"
          name="tenantName"
          type="text"
          required
          minLength={2}
          maxLength={120}
          placeholder="Ex: Lucas Ferreira Consultoria"
          className="bg-[#090B0E] border-[#242C3A]"
        />
        {state.fieldErrors?.tenantName?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.tenantName[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-semibold text-[#F3F5F7]">
          E-mail Profissional
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="lucas@exemplo.com"
          className="bg-[#090B0E] border-[#242C3A]"
        />
        {state.fieldErrors?.email?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-xs font-semibold text-[#F3F5F7]">
          Criar Senha Segura
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          placeholder="Mínimo 10 caracteres"
          className="bg-[#090B0E] border-[#242C3A]"
        />
        {state.fieldErrors?.password?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <label className="flex items-start gap-2.5 pt-1 text-xs text-[#9BA3AF] cursor-pointer">
        <input
          type="checkbox"
          name="acceptTerms"
          value="on"
          required
          className="mt-0.5 h-4 w-4 rounded border-[#242C3A] bg-[#090B0E] text-emerald-500 focus:ring-emerald-500"
        />
        <span>
          Concordo com os Termos de Uso e Política de Privacidade (LGPD).
        </span>
      </label>
      {state.fieldErrors?.acceptTerms?.[0] && (
        <p className="text-[11px] text-red-400">{state.fieldErrors.acceptTerms[0]}</p>
      )}

      <div className="flex items-start gap-2 pt-1 text-[11px] text-[#9BA3AF]">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          Ao criar seu cadastro, você recebe um tenant independente e isolado conforme as diretrizes da LGPD.
        </span>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-2"
      >
        {pending ? "Criando ambiente..." : "Criar meu Ambiente FitFlow"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
