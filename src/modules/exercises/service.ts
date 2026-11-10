import type { Prisma, StorageProvider } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertCoach, type TenantContext } from "@/server/auth/context";
import { writeAudit } from "@/server/audit";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import { seedExerciseCatalog } from "./catalog-seed";
import { customExerciseSchema, exerciseFilterSchema } from "./types";

function detectStorageProvider(url: string): StorageProvider {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "YOUTUBE";
  }
  if (lower.includes("vimeo.com")) {
    return "VIMEO";
  }
  return "EXTERNAL";
}

/**
 * Lista todas as categorias de exercícios ordenadas por `orderIndex`.
 * Caso o banco ainda não possua as 12 categorias base, realiza o seed idempotente.
 */
export async function listExerciseCategories() {
  let categories = await prisma.exerciseCategory.findMany({
    orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      orderIndex: true,
    },
  });

  if (categories.length === 0) {
    await seedExerciseCatalog(prisma);
    categories = await prisma.exerciseCategory.findMany({
      orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        orderIndex: true,
      },
    });
  }

  return categories;
}

/**
 * Lista os exercícios visíveis ao tenant atual (globais + personalizados do próprio tenant),
 * permitindo filtros combinados por categoria, grupo muscular, equipamento, escopo e busca textual.
 */
export async function listExercisesForTenant(ctx: TenantContext, rawFilter: unknown = {}) {
  const filter = parseInput(exerciseFilterSchema, rawFilter);

  const andConditions: Prisma.ExerciseWhereInput[] = [];

  if (filter.scope === "GLOBAL") {
    andConditions.push({ isGlobal: true, tenantId: null });
  } else if (filter.scope === "CUSTOM") {
    andConditions.push({ isGlobal: false, tenantId: ctx.tenantId });
  } else {
    andConditions.push({
      OR: [
        { isGlobal: true, tenantId: null },
        { isGlobal: false, tenantId: ctx.tenantId },
      ],
    });
  }

  if (filter.categoryId) {
    andConditions.push({ categoryId: filter.categoryId });
  }

  if (filter.categorySlug) {
    andConditions.push({ category: { slug: filter.categorySlug } });
  }

  if (filter.equipment) {
    andConditions.push({ equipment: filter.equipment });
  }

  if (filter.muscleGroup) {
    const mg = filter.muscleGroup;
    andConditions.push({
      OR: [
        { primaryMuscleGroup: { contains: mg, mode: "insensitive" } },
        { secondaryMuscleGroups: { has: mg } },
      ],
    });
  }

  if (filter.search) {
    const q = filter.search;
    andConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { primaryMuscleGroup: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return prisma.exercise.findMany({
    where: { AND: andConditions },
    take: filter.take,
    orderBy: [{ isGlobal: "asc" }, { name: "asc" }],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      media: {
        orderBy: { orderIndex: "asc" },
      },
      instructions: {
        orderBy: { stepNumber: "asc" },
      },
    },
  });
}

/**
 * Obtém os detalhes completos de um exercício visível ao tenant atual.
 * Retorna `NotFoundError` tanto para IDs inexistentes quanto para exercícios personalizados de outro tenant (anti-IDOR).
 */
export async function getExerciseForTenant(ctx: TenantContext, exerciseId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: {
      id: exerciseId,
      OR: [
        { isGlobal: true, tenantId: null },
        { isGlobal: false, tenantId: ctx.tenantId },
      ],
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      media: {
        orderBy: { orderIndex: "asc" },
      },
      instructions: {
        orderBy: { stepNumber: "asc" },
      },
    },
  });

  if (!exercise) {
    throw new NotFoundError("Exercício não encontrado.");
  }

  return exercise;
}

/**
 * Cria um exercício personalizado pertencente exclusivamente ao tenant do treinador autenticado.
 * `tenantId` e `isGlobal: false` são fixados no servidor.
 */
export async function createCustomExerciseForTenant(ctx: TenantContext, rawInput: unknown) {
  assertCoach(ctx);
  const data = parseInput(customExerciseSchema, rawInput);

  const category = await prisma.exerciseCategory.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new ValidationError("Categoria de exercício inválida.", {
      categoryId: ["Selecione uma categoria existente."],
    });
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.exercise.create({
      data: {
        tenantId: ctx.tenantId,
        isGlobal: false,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        primaryMuscleGroup: data.primaryMuscleGroup,
        secondaryMuscleGroups: data.secondaryMuscleGroups,
        equipment: data.equipment,
        difficulty: data.difficulty,
        instructions: {
          create: data.instructions.map((item, idx) => ({
            stepNumber: idx + 1,
            instruction: item.instruction,
            safetyTip: item.safetyTip,
          })),
        },
        media: {
          create: data.media.map((item, idx) => ({
            mediaType: item.mediaType,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            storageProvider: detectStorageProvider(item.url),
            orderIndex: idx,
          })),
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { orderIndex: "asc" } },
        instructions: { orderBy: { stepNumber: "asc" } },
      },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "EXERCISE_CREATED",
      resource: "exercise",
      resourceId: created.id,
      metadata: { name: created.name, categoryId: created.categoryId },
    });

    return created;
  });
}

/**
 * Atualiza um exercício personalizado do próprio tenant.
 * - Exercícios globais disparam `ForbiddenError`.
 * - Exercícios de outro tenant ou inexistentes disparam `NotFoundError`.
 */
export async function updateCustomExerciseForTenant(
  ctx: TenantContext,
  exerciseId: string,
  rawInput: unknown
) {
  assertCoach(ctx);
  const data = parseInput(customExerciseSchema, rawInput);

  const existing = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true, tenantId: true, isGlobal: true },
  });

  if (!existing) {
    throw new NotFoundError("Exercício não encontrado.");
  }

  if (existing.isGlobal) {
    throw new ForbiddenError("Exercícios do catálogo global não podem ser alterados.");
  }

  if (existing.tenantId !== ctx.tenantId) {
    throw new NotFoundError("Exercício não encontrado.");
  }

  const category = await prisma.exerciseCategory.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new ValidationError("Categoria de exercício inválida.", {
      categoryId: ["Selecione uma categoria existente."],
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.exerciseInstruction.deleteMany({
      where: { exerciseId: existing.id },
    });

    await tx.exerciseMedia.deleteMany({
      where: { exerciseId: existing.id },
    });

    const updated = await tx.exercise.update({
      where: { id: existing.id, tenantId: ctx.tenantId, isGlobal: false },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        primaryMuscleGroup: data.primaryMuscleGroup,
        secondaryMuscleGroups: data.secondaryMuscleGroups,
        equipment: data.equipment,
        difficulty: data.difficulty,
        instructions: {
          create: data.instructions.map((item, idx) => ({
            stepNumber: idx + 1,
            instruction: item.instruction,
            safetyTip: item.safetyTip,
          })),
        },
        media: {
          create: data.media.map((item, idx) => ({
            mediaType: item.mediaType,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            storageProvider: detectStorageProvider(item.url),
            orderIndex: idx,
          })),
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { orderIndex: "asc" } },
        instructions: { orderBy: { stepNumber: "asc" } },
      },
    });

    await writeAudit(tx, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "EXERCISE_UPDATED",
      resource: "exercise",
      resourceId: updated.id,
      metadata: { name: updated.name, categoryId: updated.categoryId },
    });

    return updated;
  });
}

/**
 * Exclui um exercício personalizado pertencente ao tenant do treinador.
 * - Exercícios globais disparam `ForbiddenError`.
 * - Exercícios de outro tenant ou inexistentes disparam `NotFoundError`.
 */
export async function deleteCustomExerciseForTenant(ctx: TenantContext, exerciseId: string) {
  assertCoach(ctx);

  const existing = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true, tenantId: true, isGlobal: true, name: true },
  });

  if (!existing) {
    throw new NotFoundError("Exercício não encontrado.");
  }

  if (existing.isGlobal) {
    throw new ForbiddenError("Exercícios do catálogo global não podem ser excluídos.");
  }

  if (existing.tenantId !== ctx.tenantId) {
    throw new NotFoundError("Exercício não encontrado.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.exercise.delete({
        where: { id: existing.id, tenantId: ctx.tenantId, isGlobal: false },
      });

      await writeAudit(tx, {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: "EXERCISE_DELETED",
        resource: "exercise",
        resourceId: existing.id,
        metadata: { name: existing.name },
      });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    ) {
      throw new ConflictError(
        "Este exercício já está vinculado a treinos ou execuções e não pode ser excluído."
      );
    }
    throw error;
  }
}
