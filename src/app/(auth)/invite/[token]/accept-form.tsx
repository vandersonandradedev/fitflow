"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { acceptInviteAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-semibold text-[#F3F5F7]">
          Crie sua Senha de Acesso
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

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-2"
      >
        {pending ? "Ativando..." : "Ativar Minha Conta"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
