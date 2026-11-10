"use client";

import { PlayCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaPreview } from "@/components/ui/media-preview";

export interface ExerciseGuideData {
  name: string;
  categoryName: string;
  primaryMuscleGroup: string;
  mediaUrl?: string | null;
  coachNotes?: string | null;
  instructions: Array<{
    stepNumber: number;
    instruction: string;
    safetyTip?: string | null;
  }>;
}

export function ExerciseGuideDialog({
  exercise,
  triggerLabel = "Ver execução",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
}: {
  exercise: ExerciseGuideData;
  triggerLabel?: string;
  triggerVariant?: "outline" | "ghost" | "secondary";
  triggerSize?: "sm" | "default";
  triggerClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
        >
          <PlayCircle className="h-4 w-4 text-primary" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
          <DialogDescription>
            {exercise.categoryName} · {exercise.primaryMuscleGroup}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {exercise.mediaUrl ? (
            <MediaPreview url={exercise.mediaUrl} alt={exercise.name} />
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Nenhuma mídia demonstrativa vinculada a este exercício.
            </div>
          )}

          {exercise.coachNotes && (
            <div className="border-l-2 border-primary pl-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Observação do treinador:</strong>{" "}
              {exercise.coachNotes}
            </div>
          )}

          {exercise.instructions.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="text-xs font-semibold text-foreground">
                Instruções passo a passo
              </h4>
              <ol className="divide-y divide-border/70">
                {exercise.instructions.map((step) => (
                  <li key={step.stepNumber} className="py-2.5 space-y-2">
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[11px] font-semibold text-primary">
                        {step.stepNumber}
                      </span>
                      <p className="leading-relaxed text-foreground">
                        {step.instruction}
                      </p>
                    </div>
                    {step.safetyTip && (
                      <div className="ml-7 flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-[11px] text-amber-200">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                        <span>{step.safetyTip}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma instrução passo a passo cadastrada para este exercício.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
