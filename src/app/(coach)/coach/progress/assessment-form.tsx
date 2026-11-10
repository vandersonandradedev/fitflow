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
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/server/actions";
import { recordAssessmentAction } from "./actions";

const initialState: ActionState = { ok: false };

export function AssessmentForm({ studentProfileId }: { studentProfileId: string }) {
  const boundAction = recordAssessmentAction.bind(null, studentProfileId);
  const [state, action, pending] = useActionState(boundAction, initialState);

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

      {/* Main Composition */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="weightKg" className="text-xs text-muted-foreground">
            Peso (kg) *
          </Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.1"
            required
            placeholder="78.5"
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="heightCm" className="text-xs text-muted-foreground">
            Altura (cm)
          </Label>
          <Input
            id="heightCm"
            name="heightCm"
            type="number"
            step="0.5"
            placeholder="178"
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="bodyFatPercentage" className="text-xs text-muted-foreground">
            Gordura (%)
          </Label>
          <Input
            id="bodyFatPercentage"
            name="bodyFatPercentage"
            type="number"
            step="0.1"
            placeholder="14.2"
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="muscleMassPercentage" className="text-xs text-muted-foreground">
            Massa musc. (%)
          </Label>
          <Input
            id="muscleMassPercentage"
            name="muscleMassPercentage"
            type="number"
            step="0.1"
            placeholder="42.0"
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Body Circumferences */}
      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-foreground">
          Perimetria e circunferências (cm)
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          <div>
            <Label htmlFor="chestCm" className="text-[11px] text-muted-foreground">
              Tórax
            </Label>
            <Input id="chestCm" name="chestCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="waistCm" className="text-[11px] text-muted-foreground">
              Cintura
            </Label>
            <Input id="waistCm" name="waistCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="abdomenCm" className="text-[11px] text-muted-foreground">
              Abdômen
            </Label>
            <Input id="abdomenCm" name="abdomenCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="hipsCm" className="text-[11px] text-muted-foreground">
              Quadril
            </Label>
            <Input id="hipsCm" name="hipsCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="rightArmCm" className="text-[11px] text-muted-foreground">
              Braço D.
            </Label>
            <Input id="rightArmCm" name="rightArmCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="leftArmCm" className="text-[11px] text-muted-foreground">
              Braço E.
            </Label>
            <Input id="leftArmCm" name="leftArmCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="rightThighCm" className="text-[11px] text-muted-foreground">
              Coxa D.
            </Label>
            <Input id="rightThighCm" name="rightThighCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="leftThighCm" className="text-[11px] text-muted-foreground">
              Coxa E.
            </Label>
            <Input id="leftThighCm" name="leftThighCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="rightCalfCm" className="text-[11px] text-muted-foreground">
              Panturrilha D.
            </Label>
            <Input id="rightCalfCm" name="rightCalfCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="leftCalfCm" className="text-[11px] text-muted-foreground">
              Panturrilha E.
            </Label>
            <Input id="leftCalfCm" name="leftCalfCm" type="number" step="0.5" placeholder="cm" className="h-8 font-mono text-xs" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs text-muted-foreground">
          Observações clínicas e posturais
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Ex: Boa evolução postural, redução de medida abdominal..."
          className="text-xs"
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Registrando..." : "Registrar avaliação física"}
        </Button>
      </div>
    </form>
  );
}

export function RecordAssessmentDialog({
  studentProfileId,
  studentName,
}: {
  studentProfileId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nova avaliação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar avaliação física</DialogTitle>
          <DialogDescription>Aluno: {studentName}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <AssessmentForm studentProfileId={studentProfileId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
