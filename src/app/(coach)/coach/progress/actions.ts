"use server";

import { revalidatePath } from "next/cache";
import {
  deletePhysicalAssessment,
  recordPhysicalAssessment,
} from "@/modules/progress/service";
import { formObject, toActionState, type ActionState } from "@/server/actions";
import { getTenantContext } from "@/server/auth/session";

function parseNumOrUndefined(val: unknown): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const num = Number(val);
  return Number.isFinite(num) ? num : undefined;
}

export async function recordAssessmentAction(
  studentProfileId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const raw = formObject(formData);

    await recordPhysicalAssessment(ctx, {
      studentProfileId,
      assessmentDate: raw.assessmentDate ? String(raw.assessmentDate) : undefined,
      weightKg: Number(raw.weightKg),
      heightCm: parseNumOrUndefined(raw.heightCm),
      bodyFatPercentage: parseNumOrUndefined(raw.bodyFatPercentage),
      muscleMassPercentage: parseNumOrUndefined(raw.muscleMassPercentage),
      chestCm: parseNumOrUndefined(raw.chestCm),
      waistCm: parseNumOrUndefined(raw.waistCm),
      abdomenCm: parseNumOrUndefined(raw.abdomenCm),
      hipsCm: parseNumOrUndefined(raw.hipsCm),
      rightArmCm: parseNumOrUndefined(raw.rightArmCm),
      leftArmCm: parseNumOrUndefined(raw.leftArmCm),
      rightThighCm: parseNumOrUndefined(raw.rightThighCm),
      leftThighCm: parseNumOrUndefined(raw.leftThighCm),
      rightCalfCm: parseNumOrUndefined(raw.rightCalfCm),
      leftCalfCm: parseNumOrUndefined(raw.leftCalfCm),
      notes: raw.notes ? String(raw.notes) : undefined,
    });

    revalidatePath("/coach/progress");
    revalidatePath(`/coach/students/${studentProfileId}`);
    return {
      ok: true,
      message: "Avaliação física e medidas corporais registradas com sucesso.",
    };
  });
}

export async function deleteAssessmentAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  const studentProfileId = String(formData.get("studentProfileId") ?? "").trim();

  await deletePhysicalAssessment(ctx, assessmentId);
  revalidatePath("/coach/progress");
  if (studentProfileId) {
    revalidatePath(`/coach/students/${studentProfileId}`);
  }
}
