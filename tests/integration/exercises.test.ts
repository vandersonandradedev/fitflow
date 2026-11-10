import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  INITIAL_CATEGORIES,
  INITIAL_GLOBAL_EXERCISES,
  seedExerciseCatalog,
} from "@/modules/exercises/catalog-seed";
import {
  createCustomExerciseForTenant,
  deleteCustomExerciseForTenant,
  getExerciseForTenant,
  listExerciseCategories,
  listExercisesForTenant,
  updateCustomExerciseForTenant,
} from "@/modules/exercises/service";
import { ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { createCoach, createStudent } from "./helpers";

const RANDOM_UUID = "22222222-2222-4222-8222-222222222222";

describe("Fase 4 — Biblioteca de Exercícios e Mídia", () => {
  it("realiza seed idempotente das 12 categorias anatômicas e dos exercícios globais", async () => {
    await seedExerciseCatalog(prisma);
    await seedExerciseCatalog(prisma); // segunda execução deve ser idempotente

    const categories = await listExerciseCategories();
    expect(categories).toHaveLength(12);
    expect(categories.map((c) => c.name)).toEqual(INITIAL_CATEGORIES.map((c) => c.name));

    const coach = await createCoach("cat");
    const globals = await listExercisesForTenant(coach.ctx, { scope: "GLOBAL" });
    expect(globals).toHaveLength(INITIAL_GLOBAL_EXERCISES.length);
    expect(globals.every((ex) => ex.isGlobal && ex.tenantId === null)).toBe(true);
    expect(globals.every((ex) => ex.media.length > 0 && ex.instructions.length > 0)).toBe(true);
  });

  it("filtra exercícios por categoria, grupo muscular, equipamento, escopo e busca textual", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("filter");
    const categories = await listExerciseCategories();
    const costasCat = categories.find((c) => c.slug === "costas")!;

    await createCustomExerciseForTenant(coach.ctx, {
      categoryId: costasCat.id,
      name: "Remada Cavalinho Exclusiva",
      description: "Variação unilateral no landmine para espessura dorsal",
      primaryMuscleGroup: "Grande Dorsal",
      secondaryMuscleGroups: ["Romboides", "Bíceps Braquial"],
      equipment: "BARBELL",
      difficulty: "ADVANCED",
      instructions: [
        {
          instruction: "Estabilize o quadril e puxe a ponta da barra até a linha costal.",
          safetyTip: "Mantenha a coluna neutra sem girar o tronco.",
        },
      ],
      media: [{ mediaType: "IMAGE", url: "/images/exercises/pull.svg" }],
    });

    const onlyCustom = await listExercisesForTenant(coach.ctx, { scope: "CUSTOM" });
    expect(onlyCustom).toHaveLength(1);
    expect(onlyCustom[0]?.name).toBe("Remada Cavalinho Exclusiva");

    const byCategory = await listExercisesForTenant(coach.ctx, { categorySlug: "costas" });
    expect(byCategory.length).toBeGreaterThanOrEqual(3); // 2 globais + 1 custom
    expect(byCategory.every((ex) => ex.category.slug === "costas")).toBe(true);

    const byEquipment = await listExercisesForTenant(coach.ctx, {
      categorySlug: "costas",
      equipment: "CABLE",
    });
    expect(byEquipment).toHaveLength(1);
    expect(byEquipment[0]?.name).toBe("Puxada Frontal na Polia Alta");

    const byMuscle = await listExercisesForTenant(coach.ctx, {
      muscleGroup: "Romboides",
    });
    expect(byMuscle.some((ex) => ex.name === "Remada Cavalinho Exclusiva")).toBe(true);

    const bySearch = await listExercisesForTenant(coach.ctx, {
      search: "landmine",
    });
    expect(bySearch).toHaveLength(1);
    expect(bySearch[0]?.name).toBe("Remada Cavalinho Exclusiva");
  });

  it("isola exercícios personalizados entre tenants (anti-IDOR) e ignora mass assignment de tenantId/isGlobal", async () => {
    await seedExerciseCatalog(prisma);
    const coachA = await createCoach("exA");
    const coachB = await createCoach("exB");
    const categories = await listExerciseCategories();
    const peitoCat = categories[0]!;

    // Coach A tenta injetar tenantId de B e isGlobal: true no payload
    const createdByA = await createCustomExerciseForTenant(coachA.ctx, {
      categoryId: peitoCat.id,
      name: "Supino Guilhotina Studio A",
      primaryMuscleGroup: "Peitoral Maior",
      equipment: "BARBELL",
      difficulty: "ADVANCED",
      tenantId: coachB.ctx.tenantId,
      isGlobal: true,
    });

    expect(createdByA.tenantId).toBe(coachA.ctx.tenantId);
    expect(createdByA.isGlobal).toBe(false);

    // Coach B não vê o exercício de A na listagem geral nem na personalizada
    const listBAll = await listExercisesForTenant(coachB.ctx, { scope: "ALL" });
    expect(listBAll.some((ex) => ex.id === createdByA.id)).toBe(false);
    expect(await listExercisesForTenant(coachB.ctx, { scope: "CUSTOM" })).toHaveLength(0);

    // Coach B tentando ler pelo ID recebe erro idêntico a ID inexistente
    const foreignRead = await getExerciseForTenant(coachB.ctx, createdByA.id).catch((e) => e);
    const missingRead = await getExerciseForTenant(coachB.ctx, RANDOM_UUID).catch((e) => e);
    expect(foreignRead).toBeInstanceOf(NotFoundError);
    expect(missingRead).toBeInstanceOf(NotFoundError);
    expect(foreignRead.message).toBe(missingRead.message);

    // Coach B tentando editar ou excluir o exercício de A recebe NotFoundError
    await expect(
      updateCustomExerciseForTenant(coachB.ctx, createdByA.id, {
        categoryId: peitoCat.id,
        name: "Adulterado por B",
        primaryMuscleGroup: "Peitoral",
      })
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(deleteCustomExerciseForTenant(coachB.ctx, createdByA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Exercício de A permanece intacto e pode ser editado/excluído pelo próprio Coach A
    const updatedByA = await updateCustomExerciseForTenant(coachA.ctx, createdByA.id, {
      categoryId: peitoCat.id,
      name: "Supino Guilhotina Controlado",
      primaryMuscleGroup: "Peitoral Superior",
      secondaryMuscleGroups: ["Deltoide Anterior"],
      equipment: "DUMBBELL",
      difficulty: "INTERMEDIATE",
      instructions: [{ instruction: "Desça em 3 segundos controlando a linha dos cotovelos." }],
      media: [{ mediaType: "VIDEO", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
    });

    expect(updatedByA.name).toBe("Supino Guilhotina Controlado");
    expect(updatedByA.media[0]?.storageProvider).toBe("YOUTUBE");

    await deleteCustomExerciseForTenant(coachA.ctx, createdByA.id);
    await expect(getExerciseForTenant(coachA.ctx, createdByA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("impede alteração ou exclusão de exercícios globais", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("glob");
    const globals = await listExercisesForTenant(coach.ctx, { scope: "GLOBAL" });
    const targetGlobal = globals[0]!;

    await expect(
      updateCustomExerciseForTenant(coach.ctx, targetGlobal.id, {
        categoryId: targetGlobal.categoryId,
        name: "Tentativa de sobrescrever global",
        primaryMuscleGroup: "Peitoral",
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(deleteCustomExerciseForTenant(coach.ctx, targetGlobal.id)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("permite ao aluno consultar exercícios globais e do seu tenant, mas bloqueia mutações e leitura de outro tenant", async () => {
    await seedExerciseCatalog(prisma);
    const coachA = await createCoach("stA");
    const coachB = await createCoach("stB");
    const studentA = await createStudent(coachA.ctx, "sA");
    const categories = await listExerciseCategories();

    const exA = await createCustomExerciseForTenant(coachA.ctx, {
      categoryId: categories[0]!.id,
      name: "Exercício Exclusivo Tenant A",
      primaryMuscleGroup: "Peitoral",
    });

    const exB = await createCustomExerciseForTenant(coachB.ctx, {
      categoryId: categories[0]!.id,
      name: "Exercício Exclusivo Tenant B",
      primaryMuscleGroup: "Peitoral",
    });

    // Aluno A lê o exercício de A e os globais, mas não o de B
    const visibleToStudentA = await listExercisesForTenant(studentA.ctx, { scope: "ALL" });
    expect(visibleToStudentA.some((ex) => ex.id === exA.id)).toBe(true);
    expect(visibleToStudentA.some((ex) => ex.id === exB.id)).toBe(false);

    expect((await getExerciseForTenant(studentA.ctx, exA.id)).name).toBe(
      "Exercício Exclusivo Tenant A"
    );
    await expect(getExerciseForTenant(studentA.ctx, exB.id)).rejects.toBeInstanceOf(NotFoundError);

    // Aluno A não pode criar, atualizar nem excluir exercícios
    await expect(
      createCustomExerciseForTenant(studentA.ctx, {
        categoryId: categories[0]!.id,
        name: "Criado por Aluno",
        primaryMuscleGroup: "Peitoral",
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      updateCustomExerciseForTenant(studentA.ctx, exA.id, {
        categoryId: categories[0]!.id,
        name: "Editado por Aluno",
        primaryMuscleGroup: "Peitoral",
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(deleteCustomExerciseForTenant(studentA.ctx, exA.id)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("rejeita URLs de mídia inseguras (javascript:, http:, path traversal)", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("sec");
    const categories = await listExerciseCategories();

    for (const unsafeUrl of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "http://inseguro.exemplo.com/video.mp4",
      "/images/../secret.txt",
    ]) {
      await expect(
        createCustomExerciseForTenant(coach.ctx, {
          categoryId: categories[0]!.id,
          name: "Exercício Mídia Insegura",
          primaryMuscleGroup: "Peitoral",
          media: [{ mediaType: "IMAGE", url: unsafeUrl }],
        })
      ).rejects.toBeInstanceOf(ValidationError);
    }
  });
});
