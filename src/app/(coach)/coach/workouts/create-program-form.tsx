"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
        Cadastre ou convide ao menos um aluno na aba <strong>Alunos</strong> antes de prescrever um programa de treinamento.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <div
          className={`rounded-md border p-3 text-xs ${
            state.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="studentProfileId" className="text-xs text-muted-foreground">
          Aluno destinatário *
        </Label>
        <Select
          id="studentProfileId"
          name="studentProfileId"
          required
          defaultValue={defaultStudentId ?? students[0]?.id ?? ""}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.email})
            </option>
          ))}
        </Select>
        {state.fieldErrors?.studentProfileId && (
          <p className="text-xs text-red-400">{state.fieldErrors.studentProfileId[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs text-muted-foreground">
            Título do programa *
          </Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Ex: Mesociclo 1 — Hipertrofia ABC"
          />
          {state.fieldErrors?.title && (
            <p className="text-xs text-red-400">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goal" className="text-xs text-muted-foreground">
            Foco / objetivo do ciclo
          </Label>
          <Input
            id="goal"
            name="goal"
            placeholder="Ex: Ganho de Força e Base Muscular"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs text-muted-foreground">
          Orientações gerais ao aluno
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Instruções sobre aquecimento, cadência padrão e progressão de carga semanal..."
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando programa..." : "Criar programa e abrir editor"}
        </Button>
      </div>
    </form>
  );
}

export function CreateProgramDialog({
  students,
  defaultStudentId,
  defaultOpen = false,
}: {
  students: StudentSelectOption[];
  defaultStudentId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Novo programa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo programa de treinamento</DialogTitle>
          <DialogDescription>
            O programa inicia em rascunho para você montar os dias e publicar quando estiver pronto.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <CreateProgramForm
            students={students}
            defaultStudentId={defaultStudentId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
