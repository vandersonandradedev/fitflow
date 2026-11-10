"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          className={`rounded-lg border p-3 text-xs ${
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
          <Label htmlFor="weightKg" className="text-xs text-[#9BA3AF]">
            Peso (kg) *
          </Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.1"
            required
            placeholder="Ex: 78.5"
            className="h-9 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="heightCm" className="text-xs text-[#9BA3AF]">
            Altura (cm)
          </Label>
          <Input
            id="heightCm"
            name="heightCm"
            type="number"
            step="0.5"
            placeholder="Ex: 178"
            className="h-9 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="bodyFatPercentage" className="text-xs text-[#9BA3AF]">
            Gordura Corporal (%)
          </Label>
          <Input
            id="bodyFatPercentage"
            name="bodyFatPercentage"
            type="number"
            step="0.1"
            placeholder="Ex: 14.2"
            className="h-9 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="muscleMassPercentage" className="text-xs text-[#9BA3AF]">
            Massa Muscular (%)
          </Label>
          <Input
            id="muscleMassPercentage"
            name="muscleMassPercentage"
            type="number"
            step="0.1"
            placeholder="Ex: 42.0"
            className="h-9 bg-[#090B0E] border-[#242C3A] text-xs"
          />
        </div>
      </div>

      {/* Body Circumferences */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-[#F3F5F7]">Perimetria & Circunferências (cm)</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 pt-1">
          <div>
            <Label htmlFor="chestCm" className="text-[11px] text-[#647082]">
              Tórax
            </Label>
            <Input
              id="chestCm"
              name="chestCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="waistCm" className="text-[11px] text-[#647082]">
              Cintura
            </Label>
            <Input
              id="waistCm"
              name="waistCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="abdomenCm" className="text-[11px] text-[#647082]">
              Abdômen
            </Label>
            <Input
              id="abdomenCm"
              name="abdomenCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="hipsCm" className="text-[11px] text-[#647082]">
              Quadril
            </Label>
            <Input
              id="hipsCm"
              name="hipsCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="rightArmCm" className="text-[11px] text-[#647082]">
              Braço D.
            </Label>
            <Input
              id="rightArmCm"
              name="rightArmCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="leftArmCm" className="text-[11px] text-[#647082]">
              Braço E.
            </Label>
            <Input
              id="leftArmCm"
              name="leftArmCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="rightThighCm" className="text-[11px] text-[#647082]">
              Coxa D.
            </Label>
            <Input
              id="rightThighCm"
              name="rightThighCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="leftThighCm" className="text-[11px] text-[#647082]">
              Coxa E.
            </Label>
            <Input
              id="leftThighCm"
              name="leftThighCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="rightCalfCm" className="text-[11px] text-[#647082]">
              Panturrilha D.
            </Label>
            <Input
              id="rightCalfCm"
              name="rightCalfCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>

          <div>
            <Label htmlFor="leftCalfCm" className="text-[11px] text-[#647082]">
              Panturrilha E.
            </Label>
            <Input
              id="leftCalfCm"
              name="leftCalfCm"
              type="number"
              step="0.5"
              placeholder="cm"
              className="h-8 bg-[#090B0E] border-[#242C3A] text-xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs text-[#9BA3AF]">
          Observações Clínicas e Posturais
        </Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Ex: Redução visível de retenção hídrica na região abdominal, boa recuperação muscular."
          className="w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 py-1.5 text-xs text-[#F3F5F7]"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending} className="h-9">
          {pending ? "Registrando..." : "Registrar Avaliação Física"}
        </Button>
      </div>
    </form>
  );
}
