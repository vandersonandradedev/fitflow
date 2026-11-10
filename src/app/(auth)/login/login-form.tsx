"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function LoginForm({
  banner,
}: {
  banner?: string | null;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {banner && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {banner}
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-[#F3F5F7]">
          E-mail
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-semibold text-[#F3F5F7]">
            Senha
          </label>
          <Link href="/forgot-password" className="text-xs text-emerald-400 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••••"
          className="bg-[#090B0E] border-[#242C3A]"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-2"
      >
        {pending ? "Entrando..." : "Entrar na Plataforma"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
