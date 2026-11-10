"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      {state.error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="currentPassword" className="text-xs font-semibold text-[#F3F5F7]">
          Senha Atual
        </label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="bg-[#090B0E] border-[#242C3A]"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="newPassword" className="text-xs font-semibold text-[#F3F5F7]">
          Nova Senha (mínimo 10 caracteres)
        </label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="bg-[#090B0E] border-[#242C3A]"
        />
        {state.fieldErrors?.newPassword?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.newPassword[0]}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-1.5"
      >
        <KeyRound className="h-4 w-4" />
        {pending ? "Alterando..." : "Atualizar Senha"}
      </Button>
    </form>
  );
}
