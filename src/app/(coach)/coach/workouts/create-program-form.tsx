"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/server/actions";
import { createProgramAction } from "./actions";

export interface StudentSelectOption {
  id: string;
  name: string;
  email: string;
}

const initialState: ActionState = { ok: false };

export function CreateProgramForm({
  students,
  defaultStudentId,
}: {
  students: StudentSelectOption[];
  defaultStudentId?: string;
}) {
  const [state, action, pending] = useActionState(createProgramAction, initialState);

  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#242C3A] p-4 text-xs text-[#9BA3AF]">
        Cadastre ou convide ao menos um aluno na aba <strong>Alunos</strong> antes de prescrever um programa de treinamento.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            state.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="studentProfileId" className="text-xs text-[#9BA3AF]">
            Aluno Destinatário *
          </Label>
          <select
            id="studentProfileId"
            name="studentProfileId"
            required
            defaultValue={defaultStudentId ?? students[0]?.id ?? ""}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          {state.fieldErrors?.studentProfileId && (
            <p className="text-xs text-red-400">{state.fieldErrors.studentProfileId[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs text-[#9BA3AF]">
            Título do Programa *
          </Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Ex: Mesociclo 1 — Hipertrofia ABC"
            className="bg-[#090B0E] border-[#242C3A] text-sm"
          />
          {state.fieldErrors?.title && (
            <p className="text-xs text-red-400">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goal" className="text-xs text-[#9BA3AF]">
            Foco / Objetivo do Ciclo
          </Label>
          <Input
            id="goal"
            name="goal"
            placeholder="Ex: Ganho de Força e Base Muscular"
            className="bg-[#090B0E] border-[#242C3A] text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs text-[#9BA3AF]">
          Orientações Gerais ao Aluno
        </Label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Instruções sobre aquecimento, cadência padrão e progressão de carga semanal..."
          className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando Programa..." : "Criar Programa e Abrir Editor"}
        </Button>
      </div>
    </form>
  );
}
