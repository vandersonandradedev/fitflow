"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  abandonWorkoutSession,
  finishWorkoutSession,
  startOrResumeWorkoutSession,
} from "@/modules/sessions/service";
import type { FinishSessionInput } from "@/modules/sessions/types";
import { toActionState, type ActionState } from "@/server/actions";
import { getTenantContext } from "@/server/auth/session";

export async function startSessionAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const trainingDayId = String(formData.get("trainingDayId") ?? "").trim();
  const session = await startOrResumeWorkoutSession(ctx, { trainingDayId });

  revalidatePath("/student/today");
  redirect(`/student/session/${session.id}`);
}

export async function finishSessionAction(
  payload: FinishSessionInput
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const finished = await finishWorkoutSession(ctx, payload);

    revalidatePath("/student/today");
    revalidatePath("/student/history");
    revalidatePath("/coach/dashboard");
    revalidatePath(`/coach/students/${ctx.studentProfileId}`);

    return {
      ok: true,
      message: `Treino concluído com sucesso! Tonelagem total: ${Number(
        finished.totalVolumeKg ?? 0
      ).toLocaleString("pt-BR")} kg.`,
    };
  });
}

export async function abandonSessionAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  await abandonWorkoutSession(ctx, sessionId);

  revalidatePath("/student/today");
  redirect("/student/today");
}
