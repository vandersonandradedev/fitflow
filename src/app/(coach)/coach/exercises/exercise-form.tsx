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
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS } from "@/modules/exercises/types";
import type { ActionState } from "@/server/actions";
import { createExerciseAction, updateExerciseAction } from "./actions";
import { GalleryPickerDialog } from "@/components/ui/gallery-picker-dialog";

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
  submitLabel = "Salvar exercício personalizado",
}: {
  categories: CategoryOption[];
  initialValues?: ExerciseFormInitialValues;
  submitLabel?: string;
}) {
  const boundAction = initialValues?.id
    ? updateExerciseAction.bind(null, initialValues.id)
    : createExerciseAction;

  const [state, action, pending] = useActionState(boundAction, initialState);
  const [mediaUrl, setMediaUrl] = useState(initialValues?.mediaUrl ?? "");
  const [mediaType, setMediaType] = useState(initialValues?.mediaType ?? "IMAGE");

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-muted-foreground">
            Nome do exercício *
          </Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={initialValues?.name ?? ""}
            placeholder="Ex: Remada Unilateral no Banco"
          />
          {state.fieldErrors?.name && (
            <p className="text-xs text-red-400">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId" className="text-xs text-muted-foreground">
            Categoria anatômica *
          </Label>
          <Select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={initialValues?.categoryId ?? categories[0]?.id ?? ""}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.categoryId && (
            <p className="text-xs text-red-400">{state.fieldErrors.categoryId[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="primaryMuscleGroup" className="text-xs text-muted-foreground">
            Grupo muscular principal *
          </Label>
          <Input
            id="primaryMuscleGroup"
            name="primaryMuscleGroup"
            required
            defaultValue={initialValues?.primaryMuscleGroup ?? ""}
            placeholder="Ex: Grande Dorsal"
          />
          {state.fieldErrors?.primaryMuscleGroup && (
            <p className="text-xs text-red-400">{state.fieldErrors.primaryMuscleGroup[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="secondaryMuscleGroups" className="text-xs text-muted-foreground">
            Músculos secundários (por vírgula)
          </Label>
          <Input
            id="secondaryMuscleGroups"
            name="secondaryMuscleGroups"
            defaultValue={initialValues?.secondaryMuscleGroups?.join(", ") ?? ""}
            placeholder="Ex: Bíceps Braquial, Romboides"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipment" className="text-xs text-muted-foreground">
            Equipamento *
          </Label>
          <Select
            id="equipment"
            name="equipment"
            defaultValue={initialValues?.equipment ?? "DUMBBELL"}
          >
            {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="difficulty" className="text-xs text-muted-foreground">
            Nível técnico *
          </Label>
          <Select
            id="difficulty"
            name="difficulty"
            defaultValue={initialValues?.difficulty ?? "BEGINNER"}
          >
            {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="mediaUrl" className="text-xs text-muted-foreground">
              URL de demonstração (YouTube, Vimeo, HTTPS ou /images/exercises/...)
            </Label>
            <GalleryPickerDialog
              onSelect={(m) => {
                setMediaUrl(m.url);
                setMediaType(m.mediaType);
              }}
            />
          </div>
          <Input
            id="mediaUrl"
            name="mediaUrl"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://... ou escolha da sua galeria acima"
          />
          {state.fieldErrors?.["media.0.url"] && (
            <p className="text-xs text-red-400">{state.fieldErrors["media.0.url"][0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mediaType" className="text-xs text-muted-foreground">
            Tipo de mídia
          </Label>
          <Select
            id="mediaType"
            name="mediaType"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
          >
            <option value="IMAGE">Imagem / Diagrama</option>
            <option value="VIDEO">Vídeo Demonstrativo</option>
            <option value="GIF">GIF Animado</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs text-muted-foreground">
          Descrição biomecânica / objetivo
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initialValues?.description ?? ""}
          placeholder="Resumo objetivo da mecânica do movimento e quando prescrevê-lo..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="instructionsText" className="text-xs text-muted-foreground">
            Instruções passo a passo (1 passo por linha)
          </Label>
          <Textarea
            id="instructionsText"
            name="instructionsText"
            rows={3}
            defaultValue={initialValues?.instructionsText ?? ""}
            placeholder={"Posicione os pés na largura do quadril.\nMantenha as escápulas estabilizadas durante a fase excêntrica."}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="safetyTip" className="text-xs text-muted-foreground">
            Orientação de segurança / postura
          </Label>
          <Textarea
            id="safetyTip"
            name="safetyTip"
            rows={3}
            defaultValue={initialValues?.safetyTip ?? ""}
            placeholder="Evite compensações lombares ou perda de alinhamento articular..."
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function CreateExerciseDialog({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Novo exercício
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar exercício personalizado</DialogTitle>
          <DialogDescription>
            Exercícios personalizados ficam disponíveis apenas para o seu estúdio e seus alunos.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ExerciseForm categories={categories} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
