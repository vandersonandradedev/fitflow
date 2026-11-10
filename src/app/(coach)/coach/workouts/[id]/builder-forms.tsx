"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

      <div className="space-y-1">
        <Label htmlFor="day-name" className="text-xs text-muted-foreground">
          Nome do dia / divisão *
        </Label>
        <Input
          id="day-name"
          name="name"
          required
          placeholder="Ex: Treino A — Empurrar (Push)"
          className="h-9 text-xs"
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="day-dow" className="text-xs text-muted-foreground">
            Dia da semana *
          </Label>
          <Select id="day-dow" name="dayOfWeek" defaultValue="MONDAY" className="text-xs">
            {Object.entries(DAY_OF_WEEK_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="day-desc" className="text-xs text-muted-foreground">
            Foco do dia
          </Label>
          <Input
            id="day-desc"
            name="description"
            placeholder="Ex: Peitoral e tríceps"
            className="h-9 text-xs"
          />
        </div>
      </div>

      <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-full">
        {pending ? "Adicionando..." : "Adicionar dia de treino"}
      </Button>
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
      <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
        Adicione ao menos um <strong>Dia de treino</strong> acima antes de prescrever exercícios.
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

      <div className="space-y-1">
        <Label htmlFor="target-day" className="text-xs text-muted-foreground">
          Dia de destino *
        </Label>
        <Select
          id="target-day"
          name="trainingDayId"
          required
          defaultValue={days[0]?.id ?? ""}
          className="text-xs"
        >
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.dayOfWeekLabel})
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ex-filter" className="text-xs text-muted-foreground">
          Exercício ({filteredExercises.length} disponíveis) *
        </Label>
        <Input
          id="ex-filter"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar por nome, categoria ou músculo..."
          className="h-8 text-xs"
        />
        <Select
          id="exerciseId"
          name="exerciseId"
          required
          defaultValue={filteredExercises[0]?.id ?? ""}
          className="text-xs"
        >
          {filteredExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              [{ex.categoryName}] {ex.name} — {ex.primaryMuscleGroup}
              {ex.isGlobal ? "" : " (Personalizado)"}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <Label htmlFor="sectionType" className="text-xs text-muted-foreground">
            Seção do treino
          </Label>
          <Select id="sectionType" name="sectionType" defaultValue="MAIN" className="h-8 text-xs">
            {Object.entries(SECTION_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="supersetGroupId" className="text-xs text-muted-foreground">
            Super-série
          </Label>
          <Input
            id="supersetGroupId"
            name="supersetGroupId"
            placeholder="Ex: A1 (opcional)"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="setsCount" className="text-[11px] text-muted-foreground">
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
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="repsTarget" className="text-[11px] text-muted-foreground">
            Reps *
          </Label>
          <Input
            id="repsTarget"
            name="repsTarget"
            defaultValue="8-12"
            required
            placeholder="8-12"
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="suggestedLoadKg" className="text-[11px] text-muted-foreground">
            Carga (kg)
          </Label>
          <Input
            id="suggestedLoadKg"
            name="suggestedLoadKg"
            type="number"
            step="0.5"
            min={0}
            placeholder="40"
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="restSeconds" className="text-[11px] text-muted-foreground">
            Descanso (s) *
          </Label>
          <Input
            id="restSeconds"
            name="restSeconds"
            type="number"
            min={0}
            max={1800}
            defaultValue={90}
            required
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="tempo" className="text-[11px] text-muted-foreground">
            Cadência
          </Label>
          <Input
            id="tempo"
            name="tempo"
            placeholder="3010"
            className="h-8 font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="targetRpe" className="text-[11px] text-muted-foreground">
            RPE (1-10)
          </Label>
          <Input
            id="targetRpe"
            name="targetRpe"
            type="number"
            step="0.5"
            min={1}
            max={10}
            placeholder="8"
            className="h-8 font-mono text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="coachNotes" className="text-xs text-muted-foreground">
          Observações técnicas
        </Label>
        <Textarea
          id="coachNotes"
          name="coachNotes"
          rows={2}
          placeholder="Ex: Controle excêntrico de 3s; pausar 1s no pico."
          className="min-h-[56px] text-xs"
        />
      </div>

      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Inserindo..." : "Inserir exercício no dia"}
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
          placeholder={`Notas da v${versionNumber} (ex: Ajuste de volume)`}
          className="flex-1 text-xs"
        />
        <Button type="submit" size="sm" disabled={pending} className="shrink-0">
          {pending ? "Publicando..." : `Publicar v${versionNumber}`}
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
          placeholder="Título do template *"
          className="h-8 text-xs"
        />
        <Input
          name="category"
          placeholder="Categoria (ex: Hipertrofia ABC)"
          className="h-8 text-xs"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="h-8"
        >
          {pending ? "Salvando..." : "Salvar como template"}
        </Button>
      </div>
    </form>
  );
}
