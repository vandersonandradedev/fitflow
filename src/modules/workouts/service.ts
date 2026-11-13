import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertCoach, isCoach, type TenantContext } from "@/server/auth/context";
import { writeAudit } from "@/server/audit";
import { sendPushToUser } from "@/server/notifications/push";
import { ConflictError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import {
  addTrainingDaySchema,
  addWorkoutExerciseSchema,
  createProgramSchema,
  reorderTrainingDaysSchema,
  reorderWorkoutExercisesSchema,
  saveTemplateSchema,
  trainingDaySchema,
  updateTrainingDaySchema,
  updateWorkoutExerciseSchema,
  type TrainingDayInput,
} from "./types";
import { z } from "zod";

const versionFullInclude = {
  trainingDays: {
    orderBy: { orderIndex: "asc" as const },
    include: {
      workoutExercises: {
        orderBy: { orderIndex: "asc" as const },
        include: {
          exercise: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              media: { orderBy: { orderIndex: "asc" as const } },
              instructions: { orderBy: { stepNumber: "asc" as const } },
            },
          },
          sets: {
            orderBy: { setNumber: "asc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.TrainingProgramVersionInclude;

/**
 * Verifica que todos os `exerciseId`s referenciados pertencem ao catálogo global
 * ou ao próprio `tenantId`. Caso contrário, lança `NotFoundError`.
 */
async function assertExercisesVisibleToTenant(
  tx: Prisma.TransactionClient | typeof prisma,
  tenantId: string,
  exerciseIds: string[]
) {
  const uniqueIds = Array.from(new Set(exerciseIds));
  if (uniqueIds.length === 0) return;

  const found = await tx.exercise.findMany({
    where: {
      id: { in: uniqueIds },
      OR: [
        { isGlobal: true, tenantId: null },
        { isGlobal: false, tenantId },
      ],
    },
    select: { id: true },
  });

  if (found.length !== uniqueIds.length) {
    throw new NotFoundError("Exercício não encontrado.");
  }
}

/**
 * Cria um novo programa de treinamento para um aluno do tenant atual,
 * inicializando a versão 1 (`DRAFT`) com dias e exercícios opcionais.
 */
export async function createProgramForStudent(ctx: TenantContext, rawInput: unknown) {
  assertCoach(ctx);
  const data = parseInput(createProgramSchema, rawInput);

  const student = await prisma.studentProfile.findFirst({
    where: {
      id: data.studentProfileId,
      tenantId: ctx.tenantId,
      deletedAt: null,
    },
    select: { id: true, userId: true },
  });

  if (!student) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  const allExerciseIds = data.initialDays.flatMap((d) =>
    d.exercises.map((ex) => ex.exerciseId)
  );
  await assertExercisesVisibleToTenant(prisma, ctx.tenantId, allExerciseIds);

  return prisma.$transaction(async (tx) => {
    const program = await tx.trainingProgram.create({
      data: {
        tenantId: ctx.tenantId,
        studentProfileId: student.id,
        title: data.title,
        description: data.description,
        goal: data.goal,
        isActive: true,
        versions: {
          create: {
            versionNumber: 1,
            status: "DRAFT",
            notes: data.notes,
            trainingDays: {
              create: data.initialDays.map((day, dayIdx) => ({
                name: day.name,
                dayOfWeek: day.dayOfWeek,
                description: day.description,
                orderIndex: dayIdx,
                workoutExercises: {
                  create: day.exercises.map((wex, exIdx) => ({
                    exerciseId: wex.exerciseId,
                    sectionType: wex.sectionType,
                    supersetGroupId: wex.supersetGroupId,
                    coachNotes: wex.coachNotes,
                    orderIndex: exIdx,
                    sets: {
                      create: wex.sets.map((s, setIdx) => ({
                        setNumber: setIdx + 1,
                        repsTarget: s.repsTarget,
                        suggestedLoadKg: s.suggestedLoadKg,
                        restSeconds: s.restSeconds,
                        tempo: s.tempo,
                        targetRpe: s.targetRpe,
                      })),
                    },
                  })),
                },
              })),
            },
          },
        },
      },
      include: {
        studentProfile: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          include: versionFullInclude,
        },
      },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "PROGRAM_CREATED",
      resource: "training_program",
      resourceId: program.id,
      metadata: {
        studentProfileId: student.id,
        title: program.title,
      },
    });

    return program;
  });
}

/**
 * Lista os programas de treinamento visíveis no tenant atual.
 * - Treinadores veem todos os programas do tenant (podendo filtrar por `studentProfileId`).
 * - Alunos veem exclusivamente os programas vinculados ao seu próprio `studentProfileId`.
 */
export async function listProgramsForTenant(
  ctx: TenantContext,
  filter?: { studentProfileId?: string; isActive?: boolean }
) {
  const where: Prisma.TrainingProgramWhereInput = {
    tenantId: ctx.tenantId,
  };

  if (isCoach(ctx)) {
    if (filter?.studentProfileId) {
      where.studentProfileId = filter.studentProfileId;
    }
  } else {
    where.studentProfileId = ctx.studentProfileId!;
  }

  if (typeof filter?.isActive === "boolean") {
    where.isActive = filter.isActive;
  }

  return prisma.trainingProgram.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    include: {
      studentProfile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          trainingDays: {
            orderBy: { orderIndex: "asc" },
            include: {
              _count: { select: { workoutExercises: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Obtém um programa de treinamento com todas as suas versões, dias, exercícios e séries.
 * Anti-IDOR: retorna `NotFoundError` se pertencer a outro tenant ou (quando chamado por aluno) a outro aluno.
 */
export async function getProgramForTenant(ctx: TenantContext, programId: string) {
  const where: Prisma.TrainingProgramWhereInput = {
    id: programId,
    tenantId: ctx.tenantId,
  };

  if (!isCoach(ctx)) {
    where.studentProfileId = ctx.studentProfileId!;
  }

  const program = await prisma.trainingProgram.findFirst({
    where,
    include: {
      studentProfile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: versionFullInclude,
      },
    },
  });

  if (!program) {
    throw new NotFoundError("Programa de treinamento não encontrado.");
  }

  return program;
}

/**
 * Obtém o programa ativo e a versão publicada atual de um aluno.
 * Utilizado na visão semanal e no treino do dia do aluno.
 */
export async function getPublishedProgramForStudent(
  ctx: TenantContext,
  targetStudentProfileId?: string
) {
  const studentProfileId = isCoach(ctx)
    ? (targetStudentProfileId ?? "")
    : (ctx.studentProfileId ?? "");

  if (!studentProfileId) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  const student = await prisma.studentProfile.findFirst({
    where: {
      id: studentProfileId,
      tenantId: ctx.tenantId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!student) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  return prisma.trainingProgram.findFirst({
    where: {
      tenantId: ctx.tenantId,
      studentProfileId: student.id,
      isActive: true,
      versions: {
        some: { status: "PUBLISHED" },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: versionFullInclude,
      },
    },
  });
}

/**
 * Helper interno que valida se a versão pertence ao `ctx.tenantId` e está em status `DRAFT`.
 * Versões `PUBLISHED` ou `ARCHIVED` são estritamente imutáveis.
 */
async function getMutableDraftVersion(ctx: TenantContext, versionId: string) {
  assertCoach(ctx);

  const version = await prisma.trainingProgramVersion.findFirst({
    where: {
      id: versionId,
      program: { tenantId: ctx.tenantId },
    },
    include: {
      program: {
        select: {
          id: true,
          tenantId: true,
          studentProfileId: true,
          title: true,
          studentProfile: { select: { userId: true } },
        },
      },
      trainingDays: {
        orderBy: { orderIndex: "asc" },
        include: {
          workoutExercises: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!version) {
    throw new NotFoundError("Versão do programa não encontrada.");
  }

  if (version.status !== "DRAFT") {
    throw new ConflictError(
      "Versões publicadas ou arquivadas são imutáveis. Crie uma nova versão em rascunho para editar."
    );
  }

  return version;
}

/**
 * Cria uma nova versão em rascunho (`DRAFT`) clonando integralmente a última versão do programa.
 * Preserva a imutabilidade das versões já publicadas e dos históricos de execução vinculados a elas.
 */
export async function createNewDraftVersion(
  ctx: TenantContext,
  programId: string,
  notes?: string
) {
  assertCoach(ctx);

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, tenantId: ctx.tenantId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: versionFullInclude,
      },
    },
  });

  if (!program) {
    throw new NotFoundError("Programa de treinamento não encontrado.");
  }

  const existingDraft = program.versions.find((v) => v.status === "DRAFT");
  if (existingDraft) {
    throw new ConflictError(
      "Já existe uma versão em rascunho aberta para este programa."
    );
  }

  const latestVersion = program.versions[0];
  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  return prisma.$transaction(async (tx) => {
    const createdVersion = await tx.trainingProgramVersion.create({
      data: {
        programId: program.id,
        versionNumber: nextVersionNumber,
        status: "DRAFT",
        notes: notes?.trim() || `Evolução da v${latestVersion?.versionNumber ?? 1}`,
        trainingDays: latestVersion
          ? {
              create: latestVersion.trainingDays.map((day, dayIdx) => ({
                name: day.name,
                dayOfWeek: day.dayOfWeek,
                description: day.description,
                orderIndex: dayIdx,
                workoutExercises: {
                  create: day.workoutExercises.map((wex, exIdx) => ({
                    exerciseId: wex.exerciseId,
                    sectionType: wex.sectionType,
                    supersetGroupId: wex.supersetGroupId,
                    coachNotes: wex.coachNotes,
                    orderIndex: exIdx,
                    sets: {
                      create: wex.sets.map((s, setIdx) => ({
                        setNumber: setIdx + 1,
                        repsTarget: s.repsTarget,
                        suggestedLoadKg: s.suggestedLoadKg,
                        restSeconds: s.restSeconds,
                        tempo: s.tempo,
                        targetRpe: s.targetRpe,
                      })),
                    },
                  })),
                },
              })),
            }
          : undefined,
      },
      include: versionFullInclude,
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "PROGRAM_DRAFT_VERSION_CREATED",
      resource: "training_program_version",
      resourceId: createdVersion.id,
      metadata: {
        programId: program.id,
        versionNumber: nextVersionNumber,
      },
    });

    return createdVersion;
  });
}

/**
 * Publica uma versão em rascunho (`DRAFT` -> `PUBLISHED`):
 * - Exige ao menos 1 dia de treino com ao menos 1 exercício prescrito.
 * - Arquiva automaticamente qualquer versão `PUBLISHED` anterior do mesmo programa (`ARCHIVED`).
 * - Ativa este programa para o aluno e notifica o aluno.
 */
export async function publishProgramVersion(
  ctx: TenantContext,
  versionId: string,
  notes?: string
) {
  const draft = await getMutableDraftVersion(ctx, versionId);

  const totalExercises = draft.trainingDays.reduce(
    (acc, day) => acc + day.workoutExercises.length,
    0
  );

  if (draft.trainingDays.length === 0 || totalExercises === 0) {
    throw new ValidationError(
      "Adicione ao menos um dia de treino com exercícios prescritos antes de publicar."
    );
  }

  const published = await prisma.$transaction(async (tx) => {
    // Arquiva versões publicadas anteriores do mesmo programa
    await tx.trainingProgramVersion.updateMany({
      where: {
        programId: draft.program.id,
        status: "PUBLISHED",
      },
      data: {
        status: "ARCHIVED",
      },
    });

    // Desativa outros programas ativos do mesmo aluno e garante este como ativo
    await tx.trainingProgram.updateMany({
      where: {
        tenantId: ctx.tenantId,
        studentProfileId: draft.program.studentProfileId,
        id: { not: draft.program.id },
        isActive: true,
      },
      data: { isActive: false },
    });

    await tx.trainingProgram.update({
      where: { id: draft.program.id },
      data: { isActive: true },
    });

    const published = await tx.trainingProgramVersion.update({
      where: { id: draft.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        ...(notes !== undefined ? { notes: notes.trim() || draft.notes } : {}),
      },
      include: versionFullInclude,
    });

    await tx.notification.create({
      data: {
        tenantId: ctx.tenantId,
        userId: draft.program.studentProfile.userId,
        type: "WORKOUT_ASSIGNED",
        title: "Novo treino publicado!",
        message: `Seu treinador publicou a versão v${published.versionNumber} do programa "${draft.program.title}".`,
        link: "/student/today",
      },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "PROGRAM_VERSION_PUBLISHED",
      resource: "training_program_version",
      resourceId: published.id,
      metadata: {
        programId: draft.program.id,
        versionNumber: published.versionNumber,
      },
    });

    return published;
  });

  // Dispara notificação push em segundo plano para o celular do aluno
  sendPushToUser(draft.program.studentProfile.userId, {
    title: "Novo treino publicado! 🏋️",
    body: `Seu treinador publicou a versão v${published.versionNumber} do programa "${draft.program.title}". Toque para ver seus exercícios!`,
    url: "/student/today",
  }).catch((err) => {
    console.error("[push] Falha ao enviar push de novo treino:", err);
  });

  return published;
}

/**
 * Adiciona um dia de treino (ex: Treino A, Segunda-feira) a uma versão `DRAFT`.
 */
export async function addTrainingDayToDraft(
  ctx: TenantContext,
  versionId: string,
  rawInput: unknown
) {
  const draft = await getMutableDraftVersion(ctx, versionId);
  const data = parseInput(addTrainingDaySchema, rawInput);

  const nextOrderIndex = draft.trainingDays.length;

  return prisma.trainingDay.create({
    data: {
      versionId: draft.id,
      name: data.name,
      dayOfWeek: data.dayOfWeek,
      description: data.description,
      orderIndex: nextOrderIndex,
    },
    include: {
      workoutExercises: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });
}

/**
 * Atualiza nome, dia da semana ou descrição de um dia de treino em uma versão `DRAFT`.
 */
export async function updateTrainingDayInDraft(
  ctx: TenantContext,
  trainingDayId: string,
  rawInput: unknown
) {
  assertCoach(ctx);
  const data = parseInput(updateTrainingDaySchema, rawInput);

  const day = await prisma.trainingDay.findFirst({
    where: {
      id: trainingDayId,
      version: { program: { tenantId: ctx.tenantId } },
    },
    include: {
      version: { select: { id: true, status: true } },
    },
  });

  if (!day) {
    throw new NotFoundError("Dia de treino não encontrado.");
  }

  if (day.version.status !== "DRAFT") {
    throw new ConflictError(
      "Versões publicadas ou arquivadas são imutáveis. Crie uma nova versão em rascunho para editar."
    );
  }

  return prisma.trainingDay.update({
    where: { id: day.id },
    data: {
      name: data.name,
      dayOfWeek: data.dayOfWeek,
      description: data.description,
    },
  });
}

/**
 * Remove um dia de treino de uma versão `DRAFT` e reordena os índices restantes.
 */
export async function deleteTrainingDayFromDraft(
  ctx: TenantContext,
  trainingDayId: string
) {
  assertCoach(ctx);

  const day = await prisma.trainingDay.findFirst({
    where: {
      id: trainingDayId,
      version: { program: { tenantId: ctx.tenantId } },
    },
    include: {
      version: { select: { id: true, status: true } },
    },
  });

  if (!day) {
    throw new NotFoundError("Dia de treino não encontrado.");
  }

  if (day.version.status !== "DRAFT") {
    throw new ConflictError(
      "Versões publicadas ou arquivadas são imutáveis. Crie uma nova versão em rascunho para editar."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.trainingDay.delete({ where: { id: day.id } });

    const remaining = await tx.trainingDay.findMany({
      where: { versionId: day.version.id },
      orderBy: { orderIndex: "asc" },
      select: { id: true },
    });

    for (let i = 0; i < remaining.length; i++) {
      await tx.trainingDay.update({
        where: { id: remaining[i]!.id },
        data: { orderIndex: i },
      });
    }
  });
}

/**
 * Reordena os dias de treino dentro de uma versão `DRAFT`.
 */
export async function reorderTrainingDaysInDraft(
  ctx: TenantContext,
  versionId: string,
  rawInput: unknown
) {
  const draft = await getMutableDraftVersion(ctx, versionId);
  const { orderedDayIds } = parseInput(reorderTrainingDaysSchema, rawInput);

  const existingIds = new Set(draft.trainingDays.map((d) => d.id));
  if (
    orderedDayIds.length !== draft.trainingDays.length ||
    orderedDayIds.some((id) => !existingIds.has(id))
  ) {
    throw new ValidationError(
      "A lista de dias para reordenação não corresponde aos dias da versão."
    );
  }

  await prisma.$transaction(
    orderedDayIds.map((dayId, idx) =>
      prisma.trainingDay.update({
        where: { id: dayId },
        data: { orderIndex: idx },
      })
    )
  );
}

/**
 * Adiciona um exercício prescrito (com suas séries, repetições, carga, descanso, cadência, RPE e notas)
 * a um dia de treino pertencente a uma versão `DRAFT`.
 */
export async function addExerciseToTrainingDay(
  ctx: TenantContext,
  trainingDayId: string,
  rawInput: unknown
) {
  assertCoach(ctx);
  const data = parseInput(addWorkoutExerciseSchema, rawInput);

  const day = await prisma.trainingDay.findFirst({
    where: {
      id: trainingDayId,
      version: { program: { tenantId: ctx.tenantId } },
    },
    include: {
      version: { select: { id: true, status: true } },
      workoutExercises: { select: { id: true } },
    },
  });

  if (!day) {
    throw new NotFoundError("Dia de treino não encontrado.");
  }

  if (day.version.status !== "DRAFT") {
    throw new ConflictError(
      "Versões publicadas ou arquivadas são imutáveis. Crie uma nova versão em rascunho para editar."
    );
  }

  await assertExercisesVisibleToTenant(prisma, ctx.tenantId, [data.exerciseId]);

  const nextOrderIndex = day.workoutExercises.length;

  return prisma.workoutExercise.create({
    data: {
      trainingDayId: day.id,
      exerciseId: data.exerciseId,
      sectionType: data.sectionType,
      supersetGroupId: data.supersetGroupId,
      coachNotes: data.coachNotes,
      orderIndex: nextOrderIndex,
      sets: {
        create: data.sets.map((s, idx) => ({
          setNumber: idx + 1,
          repsTarget: s.repsTarget,
          suggestedLoadKg: s.suggestedLoadKg,
          restSeconds: s.restSeconds,
          tempo: s.tempo,
          targetRpe: s.targetRpe,
        })),
      },
    },
    include: {
      exercise: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { orderIndex: "asc" } },
        },
      },
      sets: { orderBy: { setNumber: "asc" } },
    },
  });
}

/**
 * Atualiza um exercício prescrito e suas séries dentro de uma versão `DRAFT`.
 */
export async function updateWorkoutExerciseInDraft(
  ctx: TenantContext,
  workoutExerciseId: string,
  rawInput: unknown
) {
  assertCoach(ctx);
  const data = parseInput(updateWorkoutExerciseSchema, rawInput);

  const wex = await prisma.workoutExercise.findFirst({
    where: {
      id: workoutExerciseId,
      trainingDay: {
        version: { program: { tenantId: ctx.tenantId } },
      },
    },
    include: {
      trainingDay: {
        include: { version: { select: { id: true, status: true } } },
      },
    },
  });

  if (!wex) {
    throw new NotFoundError("Exercício prescrito não encontrado.");
  }

  if (wex.trainingDay.version.status !== "DRAFT") {
    throw new ConflictError(
      "Versões publicadas ou arquivadas são imutáveis. Crie uma nova versão em rascunho para editar."
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.workoutSetPrescribed.deleteMany({
      where: { workoutExerciseId: wex.id },
    });

    return tx.workoutExercise.update({
      where: { id: wex.id },
      data: {
        sectionType: data.sectionType,
        supersetGroupId: data.supersetGroupId ?? null,
        coachNotes: data.coachNotes ?? null,
        sets: {
          create: data.sets.map((s, idx) => ({
            setNumber: idx + 1,
            repsTarget: s.repsTarget,
            suggestedLoadKg: s.suggestedLoadKg,
            restSeconds: s.restSeconds,
            tempo: s.tempo,
            targetRpe: s.targetRpe,
          })),
        },
      },
      include: {
        exercise: true,
        sets: { orderBy: { setNumber: "asc" } },
      },
    });
  });
}

/**
 * Remove um exercício prescrito de um dia de treino em rascunho e normaliza os `orderIndex`.
 */
export async function removeWorkoutExerciseFromDraft(
  ctx: TenantContext,
  workoutExerciseId: string
) {
  assertCoach(ctx);

  const wex = await prisma.workoutExercise.findFirst({
    where: {
      id: workoutExerciseId,
      trainingDay: {
        version: { program: { tenantId: ctx.tenantId } },
      },
    },
    include: {
      trainingDay: {
        include: { version: { select: { id: true, status: true } } },
      },
    },
  });

  if (!wex) {
    throw new NotFoundError("Exercício prescrito não encontrado.");
  }

  if (wex.trainingDay.version.status !== "DRAFT") {
    throw new ConflictError(
      "Versões publicadas ou arquivadas são imutáveis. Crie uma nova versão em rascunho para editar."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workoutExercise.delete({ where: { id: wex.id } });

    const remaining = await tx.workoutExercise.findMany({
      where: { trainingDayId: wex.trainingDayId },
      orderBy: { orderIndex: "asc" },
      select: { id: true },
    });

    for (let i = 0; i < remaining.length; i++) {
      await tx.workoutExercise.update({
        where: { id: remaining[i]!.id },
        data: { orderIndex: i },
      });
    }
  });
}

/**
 * Reordena os exercícios dentro de um dia de treino pertencente a uma versão `DRAFT`.
 */
export async function reorderWorkoutExercisesInDay(
  ctx: TenantContext,
  trainingDayId: string,
  rawInput: unknown
) {
  assertCoach(ctx);
  const { orderedWorkoutExerciseIds } = parseInput(
    reorderWorkoutExercisesSchema,
    rawInput
  );

  const day = await prisma.trainingDay.findFirst({
    where: {
      id: trainingDayId,
      version: { program: { tenantId: ctx.tenantId } },
    },
    include: {
      version: { select: { status: true } },
      workoutExercises: { select: { id: true } },
    },
  });

  if (!day) {
    throw new NotFoundError("Dia de treino não encontrado.");
  }

  if (day.version.status !== "DRAFT") {
    throw new ConflictError(
      "Versões publicadas ou arquivadas são imutáveis. Crie uma nova versão em rascunho para editar."
    );
  }

  const existingIds = new Set(day.workoutExercises.map((w) => w.id));
  if (
    orderedWorkoutExerciseIds.length !== day.workoutExercises.length ||
    orderedWorkoutExerciseIds.some((id) => !existingIds.has(id))
  ) {
    throw new ValidationError(
      "A lista de exercícios não corresponde aos exercícios deste dia de treino."
    );
  }

  await prisma.$transaction(
    orderedWorkoutExerciseIds.map((wexId, idx) =>
      prisma.workoutExercise.update({
        where: { id: wexId },
        data: { orderIndex: idx },
      })
    )
  );
}

/**
 * Salva a estrutura de uma versão de programa como um `WorkoutTemplate` reutilizável no tenant.
 */
export async function saveProgramVersionAsTemplate(
  ctx: TenantContext,
  versionId: string,
  rawInput: unknown
) {
  assertCoach(ctx);
  const data = parseInput(saveTemplateSchema, rawInput);

  const version = await prisma.trainingProgramVersion.findFirst({
    where: {
      id: versionId,
      program: { tenantId: ctx.tenantId },
    },
    include: versionFullInclude,
  });

  if (!version) {
    throw new NotFoundError("Versão do programa não encontrada.");
  }

  if (version.trainingDays.length === 0) {
    throw new ValidationError(
      "Não é possível salvar um template a partir de uma versão sem dias de treino."
    );
  }

  const snapshot: TrainingDayInput[] = version.trainingDays.map((day, dayIdx) => ({
    name: day.name,
    dayOfWeek: day.dayOfWeek,
    description: day.description ?? undefined,
    orderIndex: dayIdx,
    exercises: day.workoutExercises.map((wex, exIdx) => ({
      exerciseId: wex.exerciseId,
      sectionType: wex.sectionType,
      supersetGroupId: wex.supersetGroupId ?? undefined,
      coachNotes: wex.coachNotes ?? undefined,
      orderIndex: exIdx,
      sets: wex.sets.map((s, setIdx) => ({
        setNumber: setIdx + 1,
        repsTarget: s.repsTarget,
        suggestedLoadKg: s.suggestedLoadKg ? Number(s.suggestedLoadKg) : undefined,
        restSeconds: s.restSeconds,
        tempo: s.tempo ?? undefined,
        targetRpe: s.targetRpe ? Number(s.targetRpe) : undefined,
      })),
    })),
  }));

  return prisma.$transaction(async (tx) => {
    const template = await tx.workoutTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        title: data.title,
        category: data.category,
        templateData: snapshot as unknown as Prisma.InputJsonValue,
      },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "WORKOUT_TEMPLATE_CREATED",
      resource: "workout_template",
      resourceId: template.id,
      metadata: { title: template.title, sourceVersionId: version.id },
    });

    return template;
  });
}

/**
 * Lista todos os templates reutilizáveis do tenant atual.
 */
export async function listWorkoutTemplatesForTenant(ctx: TenantContext) {
  assertCoach(ctx);

  return prisma.workoutTemplate.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Aplica um `WorkoutTemplate` do tenant atual sobre uma versão `DRAFT` do mesmo tenant.
 */
export async function applyTemplateToDraftVersion(
  ctx: TenantContext,
  templateId: string,
  versionId: string
) {
  const draft = await getMutableDraftVersion(ctx, versionId);

  const template = await prisma.workoutTemplate.findFirst({
    where: {
      id: templateId,
      tenantId: ctx.tenantId,
    },
  });

  if (!template) {
    throw new NotFoundError("Template de treino não encontrado.");
  }

  const daysSchema = z.array(trainingDaySchema);
  const parsedDays = parseInput(daysSchema, template.templateData);

  const allExerciseIds = parsedDays.flatMap((d) =>
    d.exercises.map((ex) => ex.exerciseId)
  );
  await assertExercisesVisibleToTenant(prisma, ctx.tenantId, allExerciseIds);

  const baseOrderIndex = draft.trainingDays.length;

  return prisma.$transaction(async (tx) => {
    for (let i = 0; i < parsedDays.length; i++) {
      const day = parsedDays[i]!;
      await tx.trainingDay.create({
        data: {
          versionId: draft.id,
          name: day.name,
          dayOfWeek: day.dayOfWeek,
          description: day.description,
          orderIndex: baseOrderIndex + i,
          workoutExercises: {
            create: day.exercises.map((wex, exIdx) => ({
              exerciseId: wex.exerciseId,
              sectionType: wex.sectionType,
              supersetGroupId: wex.supersetGroupId,
              coachNotes: wex.coachNotes,
              orderIndex: exIdx,
              sets: {
                create: wex.sets.map((s, setIdx) => ({
                  setNumber: setIdx + 1,
                  repsTarget: s.repsTarget,
                  suggestedLoadKg: s.suggestedLoadKg,
                  restSeconds: s.restSeconds,
                  tempo: s.tempo,
                  targetRpe: s.targetRpe,
                })),
              },
            })),
          },
        },
      });
    }

    return tx.trainingProgramVersion.findUniqueOrThrow({
      where: { id: draft.id },
      include: versionFullInclude,
    });
  });
}

/**
 * Exclui um `WorkoutTemplate` do tenant atual.
 */
export async function deleteWorkoutTemplateForTenant(
  ctx: TenantContext,
  templateId: string
) {
  assertCoach(ctx);

  const existing = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, tenantId: ctx.tenantId },
    select: { id: true, title: true },
  });

  if (!existing) {
    throw new NotFoundError("Template de treino não encontrado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.workoutTemplate.delete({
      where: { id: existing.id, tenantId: ctx.tenantId },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "WORKOUT_TEMPLATE_DELETED",
      resource: "workout_template",
      resourceId: existing.id,
      metadata: { title: existing.title },
    });
  });
}

/**
 * Atualiza os dados de identificação e cabeçalho de um programa de treino.
 */
export async function updateTrainingProgramInfo(
  ctx: TenantContext,
  programId: string,
  input: {
    title?: string;
    goal?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  assertCoach(ctx);

  const existing = await prisma.trainingProgram.findFirst({
    where: { id: programId, tenantId: ctx.tenantId },
  });

  if (!existing) {
    throw new NotFoundError("Programa de treino não encontrado.");
  }

  const updated = await prisma.trainingProgram.update({
    where: { id: programId },
    data: {
      title: input.title ? input.title.trim() : undefined,
      goal: input.goal !== undefined ? (input.goal ? input.goal.trim() : null) : undefined,
      description:
        input.description !== undefined
          ? input.description
            ? input.description.trim()
            : null
          : undefined,
      isActive: input.isActive !== undefined ? input.isActive : undefined,
    },
  });

  await writeAudit(prisma, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "TRAINING_PROGRAM_UPDATED",
    resource: "training_program",
    resourceId: programId,
    metadata: { fields: Object.keys(input) },
  });

  return updated;
}

/**
 * Exclui ou arquiva um programa de treino do estúdio.
 * - Se houver sessões já concluídas pelo aluno, inativa o programa e arquiva para preservar o histórico fisiológico.
 * - Se não houver histórico concluído, remove o programa e sua árvore completa de dias/prescrições.
 */
export async function deleteTrainingProgramForTenant(
  ctx: TenantContext,
  programId: string
) {
  assertCoach(ctx);

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, tenantId: ctx.tenantId },
    select: { id: true, title: true, studentProfileId: true },
  });

  if (!program) {
    throw new NotFoundError("Programa de treino não encontrado.");
  }

  const completedSessionsCount = await prisma.workoutSession.count({
    where: {
      tenantId: ctx.tenantId,
      programVersion: { programId: program.id },
      status: "COMPLETED",
    },
  });

  return prisma.$transaction(async (tx) => {
    if (completedSessionsCount > 0) {
      await tx.trainingProgram.update({
        where: { id: program.id },
        data: { isActive: false },
      });

      await tx.trainingProgramVersion.updateMany({
        where: { programId: program.id, status: "DRAFT" },
        data: { status: "ARCHIVED" },
      });

      await writeAudit(tx, {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "TRAINING_PROGRAM_ARCHIVED",
        resource: "training_program",
        resourceId: program.id,
        metadata: { title: program.title, reason: "has_completed_sessions" },
      });

      return { ok: true, archived: true, message: "Programa desativado para preservar o histórico do aluno." };
    }

    await tx.workoutSession.deleteMany({
      where: {
        tenantId: ctx.tenantId,
        programVersion: { programId: program.id },
      },
    });

    const versions = await tx.trainingProgramVersion.findMany({
      where: { programId: program.id },
      select: { id: true },
    });

    for (const v of versions) {
      const days = await tx.trainingDay.findMany({
        where: { versionId: v.id },
        select: { id: true },
      });

      for (const d of days) {
        await tx.workoutSetPrescribed.deleteMany({
          where: { workoutExercise: { trainingDayId: d.id } },
        });
        await tx.workoutExercise.deleteMany({
          where: { trainingDayId: d.id },
        });
      }

      await tx.trainingDay.deleteMany({
        where: { versionId: v.id },
      });
    }

    await tx.trainingProgramVersion.deleteMany({
      where: { programId: program.id },
    });

    await tx.trainingProgram.delete({
      where: { id: program.id },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "TRAINING_PROGRAM_DELETED",
      resource: "training_program",
      resourceId: program.id,
      metadata: { title: program.title },
    });

    return { ok: true, deleted: true, message: "Programa excluído com sucesso." };
  });
}
