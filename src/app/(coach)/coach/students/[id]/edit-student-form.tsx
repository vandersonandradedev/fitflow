"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateStudentAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export interface StudentEditData {
  id: string;
  status: string;
  phone: string | null;
  birthDate: string | null;
  fitnessGoal: string;
  experienceLevel: string;
  trainerNotes: string | null;
  healthConditions: string | null;
}

export function EditStudentForm({ student }: { student: StudentEditData }) {
  const boundAction = updateStudentAction.bind(null, student.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="status" className="text-xs font-semibold text-[#F3F5F7]">
            Situação do Aluno
          </label>
          <select
            id="status"
            name="status"
            defaultValue={student.status}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            <option value="ACTIVE">Ativo</option>
            <option value="PAUSED">Pausado</option>
            <option value="ARCHIVED">Arquivado (revoga acesso ao portal)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="phone" className="text-xs font-semibold text-[#F3F5F7]">
            Telefone / WhatsApp
          </label>
          <Input
            id="phone"
            name="phone"
            defaultValue={student.phone ?? ""}
            placeholder="(11) 99999-0000"
            className="bg-[#090B0E] border-[#242C3A]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="birthDate" className="text-xs font-semibold text-[#F3F5F7]">
            Data de Nascimento
          </label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={student.birthDate ?? ""}
            className="bg-[#090B0E] border-[#242C3A]"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="fitnessGoal" className="text-xs font-semibold text-[#F3F5F7]">
            Objetivo de Treinamento
          </label>
          <select
            id="fitnessGoal"
            name="fitnessGoal"
            defaultValue={student.fitnessGoal}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            <option value="HYPERTROPHY">Hipertrofia</option>
            <option value="WEIGHT_LOSS">Emagrecimento</option>
            <option value="STRENGTH">Força</option>
            <option value="HEALTH">Saúde e Condicionamento</option>
            <option value="REHABILITATION">Reabilitação</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="experienceLevel" className="text-xs font-semibold text-[#F3F5F7]">
            Nível de Experiência
          </label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            defaultValue={student.experienceLevel}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            <option value="BEGINNER">Iniciante</option>
            <option value="INTERMEDIATE">Intermediário</option>
            <option value="ADVANCED">Avançado</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="trainerNotes" className="text-xs font-semibold text-[#F3F5F7]">
          Observações do Treinador (visível apenas para você)
        </label>
        <textarea
          id="trainerNotes"
          name="trainerNotes"
          rows={3}
          maxLength={2000}
          defaultValue={student.trainerNotes ?? ""}
          placeholder="Anotações técnicas sobre frequência, rotina e preferências..."
          className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] p-3 text-sm text-[#F3F5F7] focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="healthConditions" className="text-xs font-semibold text-[#F3F5F7]">
          Restrições Físicas / Observações de Saúde (Opcional — LGPD)
        </label>
        <textarea
          id="healthConditions"
          name="healthConditions"
          rows={2}
          maxLength={1000}
          defaultValue={student.healthConditions ?? ""}
          placeholder="Apenas limitações articulares ou recomendações informadas pelo aluno. Não substitui avaliação médica."
          className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] p-3 text-sm text-[#F3F5F7] focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="bg-emerald-500 hover:bg-emerald-600 text-[#090B0E] font-semibold gap-1.5"
        >
          <Save className="h-4 w-4" />
          {pending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
