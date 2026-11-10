"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCustomExerciseForTenant,
  deleteCustomExerciseForTenant,
  updateCustomExerciseForTenant,
} from "@/modules/exercises/service";
import { toActionState, type ActionState } from "@/server/actions";
import { getTenantContext } from "@/server/auth/session";

function parseExerciseFormData(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const primaryMuscleGroup = String(formData.get("primaryMuscleGroup") ?? "").trim();
  const secondaryRaw = String(formData.get("secondaryMuscleGroups") ?? "").trim();
  const equipment = String(formData.get("equipment") ?? "BODYWEIGHT").trim();
  const difficulty = String(formData.get("difficulty") ?? "BEGINNER").trim();
  const instructionsRaw = String(formData.get("instructionsText") ?? "").trim();
  const safetyTipRaw = String(formData.get("safetyTip") ?? "").trim();
  const mediaUrl = String(formData.get("mediaUrl") ?? "").trim();
  const mediaType = String(formData.get("mediaType") ?? "IMAGE").trim();

  const secondaryMuscleGroups = secondaryRaw
    ? secondaryRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const instructionsLines = instructionsRaw
    ? instructionsRaw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 3)
    : [];

  const instructions = instructionsLines.map((instruction, index) => ({
    instruction,
    safetyTip: index === 0 && safetyTipRaw ? safetyTipRaw : undefined,
  }));

  const media = mediaUrl
    ? [
        {
          mediaType: mediaType as "VIDEO" | "IMAGE" | "GIF",
          url: mediaUrl,
        },
      ]
    : [];

  return {
    categoryId,
    name,
    description: description || undefined,
    primaryMuscleGroup,
    secondaryMuscleGroups,
    equipment,
    difficulty,
    instructions,
    media,
  };
}

export async function createExerciseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const payload = parseExerciseFormData(formData);
    await createCustomExerciseForTenant(ctx, payload);
    revalidatePath("/coach/exercises");
    return {
      ok: true,
      message: "Exercício personalizado criado e adicionado ao seu catálogo privado.",
    };
  });
}

export async function updateExerciseAction(
  exerciseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const payload = parseExerciseFormData(formData);
    await updateCustomExerciseForTenant(ctx, exerciseId, payload);
    revalidatePath("/coach/exercises");
    revalidatePath(`/coach/exercises/${exerciseId}`);
    return {
      ok: true,
      message: "Exercício personalizado atualizado com sucesso.",
    };
  });
}

export async function deleteExerciseAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const exerciseId = String(formData.get("exerciseId") ?? "").trim();
  await deleteCustomExerciseForTenant(ctx, exerciseId);
  revalidatePath("/coach/exercises");
  redirect("/coach/exercises");
}
