"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addExerciseToTrainingDay,
  addTrainingDayToDraft,
  applyTemplateToDraftVersion,
  createNewDraftVersion,
  createProgramForStudent,
  deleteTrainingDayFromDraft,
  deleteWorkoutTemplateForTenant,
  getProgramForTenant,
  publishProgramVersion,
  removeWorkoutExerciseFromDraft,
  reorderTrainingDaysInDraft,
  reorderWorkoutExercisesInDay,
  saveProgramVersionAsTemplate,
  updateTrainingDayInDraft,
  updateWorkoutExerciseInDraft,
} from "@/modules/workouts/service";
import { toActionState, type ActionState } from "@/server/actions";
import { getTenantContext } from "@/server/auth/session";

export async function createProgramAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let createdId: string | null = null;
  const result = await toActionState(async () => {
    const ctx = await getTenantContext();
    const studentProfileId = String(formData.get("studentProfileId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const goal = String(formData.get("goal") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    const program = await createProgramForStudent(ctx, {
      studentProfileId,
      title,
      goal: goal || undefined,
      description: description || undefined,
    });
    createdId = program.id;
    revalidatePath("/coach/workouts");
    revalidatePath(`/coach/students/${studentProfileId}`);
    return { ok: true, message: "Programa criado com sucesso." };
  });

  if (createdId) {
    redirect(`/coach/workouts/${createdId}`);
  }
  return result;
}

export async function createDraftVersionAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  await createNewDraftVersion(ctx, programId, notes || undefined);
  revalidatePath(`/coach/workouts/${programId}`);
  revalidatePath("/coach/workouts");
}

export async function publishProgramVersionAction(
  programId: string,
  versionId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const notes = String(formData.get("notes") ?? "").trim();
    await publishProgramVersion(ctx, versionId, notes || undefined);
    revalidatePath(`/coach/workouts/${programId}`);
    revalidatePath("/coach/workouts");
    revalidatePath("/coach/dashboard");
    revalidatePath("/coach/students");
    revalidatePath("/student/today");
    revalidatePath("/student/schedule");
    return {
      ok: true,
      message: "Versão publicada com sucesso! O aluno já pode visualizar e executar o treino.",
    };
  });
}

export async function addTrainingDayAction(
  programId: string,
  versionId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const name = String(formData.get("name") ?? "").trim();
    const dayOfWeek = String(formData.get("dayOfWeek") ?? "ANY").trim();
    const description = String(formData.get("description") ?? "").trim();

    await addTrainingDayToDraft(ctx, versionId, {
      name,
      dayOfWeek,
      description: description || undefined,
    });

    revalidatePath(`/coach/workouts/${programId}`);
    return { ok: true, message: "Dia de treino adicionado ao rascunho." };
  });
}

export async function updateTrainingDayAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const trainingDayId = String(formData.get("trainingDayId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const dayOfWeek = String(formData.get("dayOfWeek") ?? "ANY").trim();
  const description = String(formData.get("description") ?? "").trim();

  await updateTrainingDayInDraft(ctx, trainingDayId, {
    name,
    dayOfWeek,
    description: description || undefined,
  });

  revalidatePath(`/coach/workouts/${programId}`);
}

export async function deleteTrainingDayAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const trainingDayId = String(formData.get("trainingDayId") ?? "").trim();

  await deleteTrainingDayFromDraft(ctx, trainingDayId);
  revalidatePath(`/coach/workouts/${programId}`);
}

export async function moveTrainingDayAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const versionId = String(formData.get("versionId") ?? "").trim();
  const trainingDayId = String(formData.get("trainingDayId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "up").trim();

  const program = await getProgramForTenant(ctx, programId);
  const version = program.versions.find((v) => v.id === versionId);
  if (!version) return;

  const ids = version.trainingDays.map((d) => d.id);
  const idx = ids.indexOf(trainingDayId);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ids.length) return;

  const reordered = [...ids];
  const temp = reordered[idx]!;
  reordered[idx] = reordered[swapIdx]!;
  reordered[swapIdx] = temp;

  await reorderTrainingDaysInDraft(ctx, versionId, { orderedDayIds: reordered });
  revalidatePath(`/coach/workouts/${programId}`);
}

function buildSetsFromForm(formData: FormData) {
  const setsCountRaw = Number(formData.get("setsCount") ?? 3);
  const setsCount = Number.isFinite(setsCountRaw)
    ? Math.min(Math.max(Math.trunc(setsCountRaw), 1), 15)
    : 3;

  const repsTarget = String(formData.get("repsTarget") ?? "10-12").trim() || "10-12";
  const loadRaw = String(formData.get("suggestedLoadKg") ?? "").trim();
  const suggestedLoadKg =
    loadRaw !== "" && Number.isFinite(Number(loadRaw)) ? Number(loadRaw) : undefined;

  const restRaw = Number(formData.get("restSeconds") ?? 60);
  const restSeconds = Number.isFinite(restRaw) && restRaw >= 0 ? Math.trunc(restRaw) : 60;

  const tempo = String(formData.get("tempo") ?? "").trim() || undefined;
  const rpeRaw = String(formData.get("targetRpe") ?? "").trim();
  const targetRpe =
    rpeRaw !== "" && Number.isFinite(Number(rpeRaw)) ? Number(rpeRaw) : undefined;

  return Array.from({ length: setsCount }, (_, idx) => ({
    setNumber: idx + 1,
    repsTarget,
    suggestedLoadKg,
    restSeconds,
    tempo,
    targetRpe,
  }));
}

export async function addExerciseToDayAction(
  programId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const trainingDayId = String(formData.get("trainingDayId") ?? "").trim();
    const exerciseId = String(formData.get("exerciseId") ?? "").trim();
    const sectionType = String(formData.get("sectionType") ?? "MAIN").trim();
    const supersetGroupId = String(formData.get("supersetGroupId") ?? "").trim();
    const coachNotes = String(formData.get("coachNotes") ?? "").trim();

    const sets = buildSetsFromForm(formData);

    await addExerciseToTrainingDay(ctx, trainingDayId, {
      exerciseId,
      sectionType,
      supersetGroupId: supersetGroupId || undefined,
      coachNotes: coachNotes || undefined,
      sets,
    });

    revalidatePath(`/coach/workouts/${programId}`);
    return { ok: true, message: "Exercício adicionado ao dia de treino." };
  });
}

export async function updateWorkoutExerciseAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "").trim();
  const sectionType = String(formData.get("sectionType") ?? "MAIN").trim();
  const supersetGroupId = String(formData.get("supersetGroupId") ?? "").trim();
  const coachNotes = String(formData.get("coachNotes") ?? "").trim();

  const sets = buildSetsFromForm(formData);

  await updateWorkoutExerciseInDraft(ctx, workoutExerciseId, {
    sectionType,
    supersetGroupId: supersetGroupId || undefined,
    coachNotes: coachNotes || undefined,
    sets,
  });

  revalidatePath(`/coach/workouts/${programId}`);
}

export async function removeWorkoutExerciseAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "").trim();

  await removeWorkoutExerciseFromDraft(ctx, workoutExerciseId);
  revalidatePath(`/coach/workouts/${programId}`);
}

export async function moveWorkoutExerciseAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const trainingDayId = String(formData.get("trainingDayId") ?? "").trim();
  const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "up").trim();

  const program = await getProgramForTenant(ctx, programId);
  const day = program.versions
    .flatMap((v) => v.trainingDays)
    .find((d) => d.id === trainingDayId);
  if (!day) return;

  const ids = day.workoutExercises.map((w) => w.id);
  const idx = ids.indexOf(workoutExerciseId);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ids.length) return;

  const reordered = [...ids];
  const temp = reordered[idx]!;
  reordered[idx] = reordered[swapIdx]!;
  reordered[swapIdx] = temp;

  await reorderWorkoutExercisesInDay(ctx, trainingDayId, {
    orderedWorkoutExerciseIds: reordered,
  });
  revalidatePath(`/coach/workouts/${programId}`);
}

export async function saveVersionAsTemplateAction(
  programId: string,
  versionId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();

    await saveProgramVersionAsTemplate(ctx, versionId, {
      title,
      category: category || undefined,
    });

    revalidatePath(`/coach/workouts/${programId}`);
    revalidatePath("/coach/workouts");
    return {
      ok: true,
      message: "Estrutura salva como template reutilizável do seu estúdio.",
    };
  });
}

export async function applyTemplateAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const programId = String(formData.get("programId") ?? "").trim();
  const versionId = String(formData.get("versionId") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();

  await applyTemplateToDraftVersion(ctx, templateId, versionId);
  revalidatePath(`/coach/workouts/${programId}`);
}

export async function deleteTemplateAction(formData: FormData): Promise<void> {
  const ctx = await getTenantContext();
  const templateId = String(formData.get("templateId") ?? "").trim();

  await deleteWorkoutTemplateForTenant(ctx, templateId);
  revalidatePath("/coach/workouts");
}
