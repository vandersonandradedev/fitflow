"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DAY_OF_WEEK_LABELS,
  SECTION_TYPE_LABELS,
} from "@/modules/workouts/types";
import type { ActionState } from "@/server/actions";
import {
  addExerciseToDayAction,
  addTrainingDayAction,
  publishProgramVersionAction,
  saveVersionAsTemplateAction,
} from "../actions";

const initialState: ActionState = { ok: false };

export interface CatalogExerciseOption {
  id: string;
  name: string;
  categoryName: string;
  primaryMuscleGroup: string;
  equipment: string;
  isGlobal: boolean;
}

export interface TrainingDaySelectOption {
  id: string;
  name: string;
  dayOfWeekLabel: string;
}

export function AddTrainingDayForm({
  programId,
  versionId,
}: {
  programId: string;
  versionId: string;
}) {
  const bound = addTrainingDayAction.bind(null, programId, versionId);
  const [state, action, pending] = useActionState(bound, initialState);

  return (
    <form action={action} className="space-y-3">
      {state.message && (
        <div
          className={`rounded-md border p-2.5 text-xs ${
            state.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="day-name" className="text-xs text-[#9BA3AF]">
            Nome do Dia / Divisão *
          </Label>
          <Input
            id="day-name"
            name="name"
            required
            placeholder="Ex: Treino A — Empurrar (Push)"
            className="h-9 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="day-dow" className="text-xs text-[#9BA3AF]">
            Dia da Semana *
          </Label>
          <select
            id="day-dow"
            name="dayOfWeek"
            defaultValue="MONDAY"
            className="flex h-9 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 text-xs text-[#F3F5F7]"
          >
            {Object.entries(DAY_OF_WEEK_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="day-desc" className="text-xs text-[#9BA3AF]">
            Foco / Observação do Dia
          </Label>
          <div className="flex gap-2">
            <Input
              id="day-desc"
              name="description"
              placeholder="Ex: Peitoral, Deltoides e Tríceps"
              className="h-9 bg-[#090B0E] border-[#242C3A] text-xs"
            />
            <Button type="submit" size="sm" disabled={pending} className="h-9 shrink-0">
              {pending ? "..." : "+ Dia"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function AddExerciseToDayForm({
  programId,
  days,
  exercises,
}: {
  programId: string;
  days: TrainingDaySelectOption[];
  exercises: CatalogExerciseOption[];
}) {
  const bound = addExerciseToDayAction.bind(null, programId);
  const [state, action, pending] = useActionState(bound, initialState);
  const [searchQuery, setSearchQuery] = useState("");

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#242C3A] p-4 text-xs text-[#9BA3AF]">
        Adicione ao menos um <strong>Dia de Treino</strong> ao rascunho antes de prescrever exercícios.
      </div>
    );
  }

  const filteredExercises = exercises.filter((ex) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.categoryName.toLowerCase().includes(q) ||
      ex.primaryMuscleGroup.toLowerCase().includes(q)
    );
  });

  return (
    <form action={action} className="space-y-3">
      {state.message && (
        <div
          className={`rounded-md border p-2.5 text-xs ${
            state.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="target-day" className="text-xs text-[#9BA3AF]">
          1. Dia de Destino *
        </Label>
        <select
          id="target-day"
          name="trainingDayId"
          required
          defaultValue={days[0]?.id ?? ""}
          className="flex h-9 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 text-xs text-[#F3F5F7]"
        >
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.dayOfWeekLabel})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ex-filter" className="text-xs text-[#9BA3AF]">
          2. Buscar na Biblioteca ({filteredExercises.length} disponíveis)
        </Label>
        <Input
          id="ex-filter"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar por nome, categoria ou músculo..."
          className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
        />
        <select
          id="exerciseId"
          name="exerciseId"
          required
          defaultValue={filteredExercises[0]?.id ?? ""}
          className="flex h-9 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 text-xs text-[#F3F5F7]"
        >
          {filteredExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              [{ex.categoryName}] {ex.name} — {ex.primaryMuscleGroup}{" "}
              {ex.isGlobal ? "" : "(Personalizado)"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <Label htmlFor="sectionType" className="text-[11px] text-[#9BA3AF]">
            Seção do Treino
          </Label>
          <select
            id="sectionType"
            name="sectionType"
            defaultValue="MAIN"
            className="flex h-8 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-2 text-xs text-[#F3F5F7]"
          >
            {Object.entries(SECTION_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="supersetGroupId" className="text-[11px] text-[#9BA3AF]">
            Bi-set / Super-série
          </Label>
          <Input
            id="supersetGroupId"
            name="supersetGroupId"
            placeholder="Ex: A1, B1 (opcional)"
            className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>
      </div>

      {/* Prescription Parameters: Sets, Reps, Load, Rest, Tempo, RPE */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="setsCount" className="text-[11px] text-[#9BA3AF]">
            Séries *
          </Label>
          <Input
            id="setsCount"
            name="setsCount"
            type="number"
            min={1}
            max={15}
            defaultValue={4}
            required
            className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="repsTarget" className="text-[11px] text-[#9BA3AF]">
            Repetições *
          </Label>
          <Input
            id="repsTarget"
            name="repsTarget"
            defaultValue="8-12"
            required
            placeholder="Ex: 8-12"
            className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="suggestedLoadKg" className="text-[11px] text-[#9BA3AF]">
            Carga Sugerida (kg)
          </Label>
          <Input
            id="suggestedLoadKg"
            name="suggestedLoadKg"
            type="number"
            step="0.5"
            min={0}
            placeholder="Ex: 40"
            className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="restSeconds" className="text-[11px] text-[#9BA3AF]">
            Descanso (seg) *
          </Label>
          <Input
            id="restSeconds"
            name="restSeconds"
            type="number"
            min={0}
            max={1800}
            defaultValue={90}
            required
            className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="tempo" className="text-[11px] text-[#9BA3AF]">
            Cadência
          </Label>
          <Input
            id="tempo"
            name="tempo"
            placeholder="Ex: 3010"
            className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="targetRpe" className="text-[11px] text-[#9BA3AF]">
            RPE Alvo (1-10)
          </Label>
          <Input
            id="targetRpe"
            name="targetRpe"
            type="number"
            step="0.5"
            min={1}
            max={10}
            placeholder="Ex: 8"
            className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="coachNotes" className="text-[11px] text-[#9BA3AF]">
          Observações Técnicas para o Aluno
        </Label>
        <textarea
          id="coachNotes"
          name="coachNotes"
          rows={2}
          placeholder="Ex: Manter controle excêntrico de 3s; pausar 1s no pico de contração."
          className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 py-1.5 text-xs text-[#F3F5F7]"
        />
      </div>

      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Inserindo no Treino..." : "Inserir Exercício no Dia"}
      </Button>
    </form>
  );
}

export function PublishVersionForm({
  programId,
  versionId,
  versionNumber,
}: {
  programId: string;
  versionId: string;
  versionNumber: number;
}) {
  const bound = publishProgramVersionAction.bind(null, programId, versionId);
  const [state, action, pending] = useActionState(bound, initialState);

  return (
    <form action={action} className="space-y-2.5">
      {state.message && (
        <div
          className={`rounded-md border p-2.5 text-xs ${
            state.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          name="notes"
          placeholder={`Notas de publicação da v${versionNumber} (ex: Ajuste de volume semanal)`}
          className="h-9 flex-1 bg-[#090B0E] border-[#242C3A] text-xs"
        />
        <Button type="submit" size="sm" disabled={pending} className="h-9 shrink-0">
          {pending ? "Publicando..." : `Publicar v${versionNumber} para o Aluno`}
        </Button>
      </div>
    </form>
  );
}

export function SaveTemplateForm({
  programId,
  versionId,
  defaultTitle,
}: {
  programId: string;
  versionId: string;
  defaultTitle: string;
}) {
  const bound = saveVersionAsTemplateAction.bind(null, programId, versionId);
  const [state, action, pending] = useActionState(bound, initialState);

  return (
    <form action={action} className="space-y-2.5">
      {state.message && (
        <div
          className={`rounded-md border p-2 text-xs ${
            state.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input
          name="title"
          required
          defaultValue={`Template: ${defaultTitle}`}
          placeholder="Título do Template *"
          className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
        />
        <Input
          name="category"
          placeholder="Categoria (ex: Hipertrofia ABC)"
          className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="h-8 border-[#242C3A] text-xs"
        >
          {pending ? "Salvando..." : "Salvar como Template"}
        </Button>
      </div>
    </form>
  );
}
