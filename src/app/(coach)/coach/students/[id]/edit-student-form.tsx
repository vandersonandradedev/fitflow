"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateStudentAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}
      {state.ok && state.message && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs text-muted-foreground">
            Situação do aluno
          </Label>
          <Select id="status" name="status" defaultValue={student.status}>
            <option value="ACTIVE">Ativo</option>
            <option value="PAUSED">Pausado</option>
            <option value="ARCHIVED">Arquivado (revoga acesso ao portal)</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs text-muted-foreground">
            Telefone / WhatsApp
          </Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={student.phone ?? ""}
            placeholder="(11) 99999-0000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birthDate" className="text-xs text-muted-foreground">
            Data de nascimento
          </Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={student.birthDate ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fitnessGoal" className="text-xs text-muted-foreground">
            Objetivo de treinamento
          </Label>
          <Select id="fitnessGoal" name="fitnessGoal" defaultValue={student.fitnessGoal}>
            <option value="HYPERTROPHY">Hipertrofia</option>
            <option value="WEIGHT_LOSS">Emagrecimento</option>
            <option value="STRENGTH">Força</option>
            <option value="HEALTH">Saúde e Condicionamento</option>
            <option value="REHABILITATION">Reabilitação</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="experienceLevel" className="text-xs text-muted-foreground">
            Nível de experiência
          </Label>
          <Select
            id="experienceLevel"
            name="experienceLevel"
            defaultValue={student.experienceLevel}
          >
            <option value="BEGINNER">Iniciante</option>
            <option value="INTERMEDIATE">Intermediário</option>
            <option value="ADVANCED">Avançado</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="trainerNotes" className="text-xs text-muted-foreground">
          Observações do treinador (visível apenas para você)
        </Label>
        <Textarea
          id="trainerNotes"
          name="trainerNotes"
          rows={3}
          maxLength={2000}
          defaultValue={student.trainerNotes ?? ""}
          placeholder="Anotações técnicas sobre frequência, rotina e preferências..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="healthConditions" className="text-xs text-muted-foreground">
          Restrições físicas / observações de saúde (LGPD)
        </Label>
        <Textarea
          id="healthConditions"
          name="healthConditions"
          rows={2}
          maxLength={1000}
          defaultValue={student.healthConditions ?? ""}
          placeholder="Apenas limitações articulares ou recomendações informadas pelo aluno."
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
