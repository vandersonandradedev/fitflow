"use server";

import { revalidatePath } from "next/cache";
import { inviteStudent, revokeInviteForTenant } from "@/modules/students/invites";
import { createStudentDirectlyForTenant, deleteStudentForTenant, updateStudentForTenant } from "@/modules/students/service";
import { formObject, toActionState, type ActionState } from "@/server/actions";
import { getTenantContext } from "@/server/auth/session";

export async function inviteStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    await inviteStudent(ctx, formObject(formData));
    revalidatePath("/coach/students");
    return {
      ok: true,
      message: "Se o e-mail estiver disponível, o convite foi enviado com validade de 48 horas.",
    };
  });
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const inviteId = String(formData.get("inviteId") ?? "");
  await revokeInviteForTenant(ctx, inviteId);
  revalidatePath("/coach/students");
}

export async function updateStudentAction(
  studentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const raw = formObject(formData);
    await updateStudentForTenant(ctx, studentId, {
      ...raw,
      birthDate: raw.birthDate ? String(raw.birthDate) : null,
      phone: raw.phone ? String(raw.phone) : null,
      trainerNotes: raw.trainerNotes ? String(raw.trainerNotes) : null,
      healthConditions: raw.healthConditions ? String(raw.healthConditions) : null,
    });
    revalidatePath("/coach/students");
    revalidatePath(`/coach/students/${studentId}`);
    revalidatePath("/coach/dashboard");
    return { ok: true, message: "Ficha do aluno atualizada com sucesso." };
  });
}

export async function createDirectStudentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const raw = formObject(formData);
    await createStudentDirectlyForTenant(ctx, raw);
    revalidatePath("/coach/students");
    revalidatePath("/coach/dashboard");
    return { ok: true, message: "Aluno matriculado com sucesso no estúdio." };
  });
}

export async function deleteStudentAction(studentId: string): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    await deleteStudentForTenant(ctx, studentId);
    revalidatePath("/coach/students");
    revalidatePath("/coach/dashboard");
    return { ok: true, message: "Aluno removido com sucesso." };
  });
}
