"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { inviteStudentAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function InviteStudentForm() {
  const [state, formAction, pending] = useActionState(inviteStudentAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {state.error}
        </div>
      )}
      {state.ok && state.message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <label htmlFor="invite-name" className="text-xs font-medium text-[#9BA3AF]">
            Nome do Aluno *
          </label>
          <Input
            id="invite-name"
            name="name"
            required
            minLength={2}
            placeholder="Ex: Mariana Costa"
            className="bg-[#090B0E] border-[#242C3A]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-email" className="text-xs font-medium text-[#9BA3AF]">
            E-mail *
          </label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="mariana@exemplo.com"
            className="bg-[#090B0E] border-[#242C3A]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-phone" className="text-xs font-medium text-[#9BA3AF]">
            Telefone (opcional)
          </label>
          <Input
            id="invite-phone"
            name="phone"
            placeholder="(11) 99999-0000"
            className="bg-[#090B0E] border-[#242C3A]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-goal" className="text-xs font-medium text-[#9BA3AF]">
            Objetivo Principal
          </label>
          <select
            id="invite-goal"
            name="fitnessGoal"
            defaultValue="HYPERTROPHY"
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7] focus:outline-none focus:border-emerald-500"
          >
            <option value="HYPERTROPHY">Hipertrofia</option>
            <option value="WEIGHT_LOSS">Emagrecimento</option>
            <option value="STRENGTH">Força</option>
            <option value="HEALTH">Saúde e Condicionamento</option>
            <option value="REHABILITATION">Reabilitação</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            {pending ? "Enviando..." : "Enviar Convite"}
          </Button>
        </div>
      </div>
    </form>
  );
}
