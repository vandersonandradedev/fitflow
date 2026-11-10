"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS } from "@/modules/exercises/types";
import type { ActionState } from "@/server/actions";
import { createExerciseAction, updateExerciseAction } from "./actions";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface ExerciseFormInitialValues {
  id?: string;
  categoryId: string;
  name: string;
  description?: string | null;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  equipment: string;
  difficulty: string;
  instructionsText?: string;
  safetyTip?: string;
  mediaUrl?: string;
  mediaType?: string;
}

const initialState: ActionState = { ok: false };

export function ExerciseForm({
  categories,
  initialValues,
  submitLabel = "Salvar Exercício Personalizado",
}: {
  categories: CategoryOption[];
  initialValues?: ExerciseFormInitialValues;
  submitLabel?: string;
}) {
  const boundAction = initialValues?.id
    ? updateExerciseAction.bind(null, initialValues.id)
    : createExerciseAction;

  const [state, action, pending] = useActionState(boundAction, initialState);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-[#9BA3AF]">
            Nome do Exercício *
          </Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={initialValues?.name ?? ""}
            placeholder="Ex: Remada Unilateral no Banco"
            className="bg-[#090B0E] border-[#242C3A] text-sm"
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-red-400">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId" className="text-xs text-[#9BA3AF]">
            Categoria Anatômica *
          </Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={initialValues?.categoryId ?? categories[0]?.id ?? ""}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.categoryId && (
            <p className="text-xs text-red-400">{state.fieldErrors.categoryId[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="primaryMuscleGroup" className="text-xs text-[#9BA3AF]">
            Grupo Muscular Principal *
          </Label>
          <Input
            id="primaryMuscleGroup"
            name="primaryMuscleGroup"
            required
            defaultValue={initialValues?.primaryMuscleGroup ?? ""}
            placeholder="Ex: Grande Dorsal"
            className="bg-[#090B0E] border-[#242C3A] text-sm"
          />
          {state.fieldErrors?.primaryMuscleGroup && (
            <p className="text-xs text-red-400">{state.fieldErrors.primaryMuscleGroup[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="secondaryMuscleGroups" className="text-xs text-[#9BA3AF]">
            Músculos Secundários (separados por vírgula)
          </Label>
          <Input
            id="secondaryMuscleGroups"
            name="secondaryMuscleGroups"
            defaultValue={initialValues?.secondaryMuscleGroups?.join(", ") ?? ""}
            placeholder="Ex: Bíceps Braquial, Romboides"
            className="bg-[#090B0E] border-[#242C3A] text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipment" className="text-xs text-[#9BA3AF]">
            Equipamento *
          </Label>
          <select
            id="equipment"
            name="equipment"
            defaultValue={initialValues?.equipment ?? "DUMBBELL"}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="difficulty" className="text-xs text-[#9BA3AF]">
            Nível Técnico *
          </Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={initialValues?.difficulty ?? "BEGINNER"}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="mediaUrl" className="text-xs text-[#9BA3AF]">
            URL de Demonstração (HTTPS ou /images/exercises/...)
          </Label>
          <Input
            id="mediaUrl"
            name="mediaUrl"
            defaultValue={initialValues?.mediaUrl ?? ""}
            placeholder="https://... ou /images/exercises/push.svg"
            className="bg-[#090B0E] border-[#242C3A] text-sm"
          />
          {state.fieldErrors?.["media.0.url"] && (
            <p className="text-xs text-red-400">{state.fieldErrors["media.0.url"][0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mediaType" className="text-xs text-[#9BA3AF]">
            Tipo de Mídia
          </Label>
          <select
            id="mediaType"
            name="mediaType"
            defaultValue={initialValues?.mediaType ?? "IMAGE"}
            className="flex h-10 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          >
            <option value="IMAGE">Imagem / Diagrama</option>
            <option value="VIDEO">Vídeo Demonstrativo</option>
            <option value="GIF">GIF Animado</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs text-[#9BA3AF]">
          Descrição Biomecânica / Objetivo
        </Label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initialValues?.description ?? ""}
          placeholder="Resumo objetivo da mecânica do movimento e quando prescrevê-lo..."
          className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="instructionsText" className="text-xs text-[#9BA3AF]">
            Instruções Passo a Passo (1 passo por linha)
          </Label>
          <textarea
            id="instructionsText"
            name="instructionsText"
            rows={3}
            defaultValue={initialValues?.instructionsText ?? ""}
            placeholder={"Posicione os pés na largura do quadril.\nMantenha as escápulas estabilizadas durante a fase excêntrica."}
            className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="safetyTip" className="text-xs text-[#9BA3AF]">
            Orientação de Segurança / Postura
          </Label>
          <textarea
            id="safetyTip"
            name="safetyTip"
            rows={3}
            defaultValue={initialValues?.safetyTip ?? ""}
            placeholder="Evite compensações lombares ou perda de alinhamento articular..."
            className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-3 py-2 text-sm text-[#F3F5F7]"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
