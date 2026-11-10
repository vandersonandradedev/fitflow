"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.ok && state.message) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-xs text-[#9BA3AF] leading-relaxed">{state.message}</p>
        <Link href="/login">
          <Button variant="outline" className="w-full border-[#242C3A] hover:bg-[#1D2430]">
            Voltar ao Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-[#F3F5F7]">
          E-mail da conta
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu.email@exemplo.com"
          className="bg-[#090B0E] border-[#242C3A]"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-2"
      >
        {pending ? "Enviando..." : "Enviar Link de Redefinição"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
