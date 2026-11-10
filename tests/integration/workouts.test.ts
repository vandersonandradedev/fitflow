import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getCoachDashboard } from "@/modules/dashboard/service";
import { seedExerciseCatalog } from "@/modules/exercises/catalog-seed";
import {
  createCustomExerciseForTenant,
  listExerciseCategories,
  listExercisesForTenant,
} from "@/modules/exercises/service";
import {
  addExerciseToTrainingDay,
  addTrainingDayToDraft,
  applyTemplateToDraftVersion,
  createNewDraftVersion,
  createProgramForStudent,
  deleteTrainingDayFromDraft,
  deleteWorkoutTemplateForTenant,
  getProgramForTenant,
  getPublishedProgramForStudent,
  listProgramsForTenant,
  listWorkoutTemplatesForTenant,
  publishProgramVersion,
  removeWorkoutExerciseFromDraft,
  reorderTrainingDaysInDraft,
  reorderWorkoutExercisesInDay,
  saveProgramVersionAsTemplate,
  updateTrainingDayInDraft,
  updateWorkoutExerciseInDraft,
} from "@/modules/workouts/service";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/server/errors";
import { createCoach, createStudent } from "./helpers";

const RANDOM_UUID = "33333333-3333-4333-8333-333333333333";

describe("Fase 5 — Editor de Treinos, Versionamento Imutável e Programação Semanal", () => {
  it("executa o ciclo completo: criação em DRAFT, adição/reordenação de dias e exercícios, publicação e evolução v2 sem alterar v1", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("wk1");
    const student = await createStudent(coach.ctx, "stwk1");
    const globals = await listExercisesForTenant(coach.ctx, { scope: "GLOBAL" });
    const supino = globals.find((e) => e.name.includes("Supino Reto"))!;
    const puxada = globals.find((e) => e.name.includes("Puxada Frontal"))!;
    const agachamento = globals.find((e) => e.name.includes("Agachamento"))!;

    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Hipertrofia Mesociclo 1",
      goal: "Ganho de Massa Muscular",
      description: "Divisão AB com progressão linear",
    });

    const v1Draft = program.versions[0]!;
    expect(v1Draft.versionNumber).toBe(1);
    expect(v1Draft.status).toBe("DRAFT");

    // Não permite publicar rascunho vazio sem dias/exercícios
    await expect(publishProgramVersion(coach.ctx, v1Draft.id)).rejects.toBeInstanceOf(
      ValidationError
    );

    // Adiciona Dia A e Dia B
    const dayA = await addTrainingDayToDraft(coach.ctx, v1Draft.id, {
      name: "Treino A — Superiores",
      dayOfWeek: "MONDAY",
      description: "Empurrar e Puxar Horizontal/Vertical",
    });
    const dayB = await addTrainingDayToDraft(coach.ctx, v1Draft.id, {
      name: "Treino B — Inferiores",
      dayOfWeek: "WEDNESDAY",
      description: "Quadríceps e Cadeia Posterior",
    });

    // Prescreve exercícios no Dia A e no Dia B
    const wexSupino = await addExerciseToTrainingDay(coach.ctx, dayA.id, {
      exerciseId: supino.id,
      sectionType: "MAIN",
      supersetGroupId: "A1",
      coachNotes: "Pausa de 1s no peito",
      sets: [
        { setNumber: 1, repsTarget: "8-10", suggestedLoadKg: 60, restSeconds: 90, tempo: "3010", targetRpe: 8 },
        { setNumber: 2, repsTarget: "8-10", suggestedLoadKg: 65, restSeconds: 90, tempo: "3010", targetRpe: 8.5 },
      ],
    });

    const wexPuxada = await addExerciseToTrainingDay(coach.ctx, dayA.id, {
      exerciseId: puxada.id,
      sectionType: "MAIN",
      supersetGroupId: "A2",
      sets: [
        { setNumber: 1, repsTarget: "10-12", suggestedLoadKg: 55, restSeconds: 90 },
      ],
    });

    await addExerciseToTrainingDay(coach.ctx, dayB.id, {
      exerciseId: agachamento.id,
      sectionType: "MAIN",
      sets: [
        { setNumber: 1, repsTarget: "6-8", suggestedLoadKg: 80, restSeconds: 120 },
      ],
    });

    // Reordena exercícios no Dia A (Puxada primeiro, Supino depois)
    await reorderWorkoutExercisesInDay(coach.ctx, dayA.id, {
      orderedWorkoutExerciseIds: [wexPuxada.id, wexSupino.id],
    });

    // Reordena os dias (Dia B primeiro, Dia A depois, e volta para A, B)
    await reorderTrainingDaysInDraft(coach.ctx, v1Draft.id, {
      orderedDayIds: [dayB.id, dayA.id],
    });
    await reorderTrainingDaysInDraft(coach.ctx, v1Draft.id, {
      orderedDayIds: [dayA.id, dayB.id],
    });

    // Publica a v1
    const v1Published = await publishProgramVersion(
      coach.ctx,
      v1Draft.id,
      "Versão inicial liberada"
    );
    expect(v1Published.status).toBe("PUBLISHED");
    expect(v1Published.publishedAt).not.toBeNull();
    expect(v1Published.trainingDays[0]?.workoutExercises[0]?.exerciseId).toBe(puxada.id);

    // Dashboard agora contabiliza 1 programa ativo publicado
    const dash = await getCoachDashboard(coach.ctx);
    expect(dash.activePrograms).toBe(1);

    // Aluno enxerga o programa publicado na sua programação semanal
    const studentPublished = await getPublishedProgramForStudent(student.ctx);
    expect(studentPublished?.id).toBe(program.id);
    expect(studentPublished?.versions[0]?.versionNumber).toBe(1);

    // IMUTABILIDADE: tentar alterar diretamente uma versão PUBLISHED dispara ConflictError
    await expect(
      addTrainingDayToDraft(coach.ctx, v1Published.id, {
        name: "Dia Inválido",
        dayOfWeek: "FRIDAY",
      })
    ).rejects.toBeInstanceOf(ConflictError);

    await expect(
      updateTrainingDayInDraft(coach.ctx, dayA.id, {
        name: "Adulterado",
        dayOfWeek: "TUESDAY",
      })
    ).rejects.toBeInstanceOf(ConflictError);

    await expect(deleteTrainingDayFromDraft(coach.ctx, dayA.id)).rejects.toBeInstanceOf(
      ConflictError
    );

    await expect(
      updateWorkoutExerciseInDraft(coach.ctx, wexSupino.id, {
        sectionType: "MAIN",
        sets: [{ setNumber: 1, repsTarget: "20", restSeconds: 30 }],
      })
    ).rejects.toBeInstanceOf(ConflictError);

    await expect(removeWorkoutExerciseFromDraft(coach.ctx, wexSupino.id)).rejects.toBeInstanceOf(
      ConflictError
    );

    // Cria nova versão em rascunho (v2) clonando a v1
    const v2Draft = await createNewDraftVersion(coach.ctx, program.id, "Ajuste de carga semana 5");
    expect(v2Draft.versionNumber).toBe(2);
    expect(v2Draft.status).toBe("DRAFT");
    expect(v2Draft.trainingDays).toHaveLength(2);

    // Não permite abrir segundo rascunho simultâneo no mesmo programa
    await expect(createNewDraftVersion(coach.ctx, program.id)).rejects.toBeInstanceOf(
      ConflictError
    );

    // Edita exercício na v2 e publica a v2
    const v2FirstWex = v2Draft.trainingDays[0]!.workoutExercises[0]!;
    await updateWorkoutExerciseInDraft(coach.ctx, v2FirstWex.id, {
      sectionType: "MAIN",
      coachNotes: "Progressão de carga v2",
      sets: [
        { setNumber: 1, repsTarget: "8-10", suggestedLoadKg: 65, restSeconds: 90 },
        { setNumber: 2, repsTarget: "8-10", suggestedLoadKg: 65, restSeconds: 90 },
        { setNumber: 3, repsTarget: "8-10", suggestedLoadKg: 65, restSeconds: 90 },
      ],
    });

    const v2Published = await publishProgramVersion(coach.ctx, v2Draft.id);
    expect(v2Published.status).toBe("PUBLISHED");

    // Verifica que a v1 foi arquivada como ARCHIVED e manteve suas séries originais intactas
    const fullProgram = await getProgramForTenant(coach.ctx, program.id);
    const archivedV1 = fullProgram.versions.find((v) => v.versionNumber === 1)!;
    expect(archivedV1.status).toBe("ARCHIVED");
    expect(archivedV1.trainingDays[0]?.workoutExercises[0]?.sets).toHaveLength(1);
    expect(v2Published.trainingDays[0]?.workoutExercises[0]?.sets).toHaveLength(3);
  });

  it("garante isolamento multi-tenant (anti-IDOR) e controle de acesso entre treinadores e alunos", async () => {
    await seedExerciseCatalog(prisma);
    const coachA = await createCoach("isoA");
    const coachB = await createCoach("isoB");
    const studentA1 = await createStudent(coachA.ctx, "sA1");
    const studentA2 = await createStudent(coachA.ctx, "sA2");
    const studentB1 = await createStudent(coachB.ctx, "sB1");
    const categories = await listExerciseCategories();
    const globals = await listExercisesForTenant(coachA.ctx, { scope: "GLOBAL" });

    // Coach A não consegue criar programa para aluno do Coach B
    await expect(
      createProgramForStudent(coachA.ctx, {
        studentProfileId: studentB1.studentProfileId,
        title: "Invasão Cross-Tenant",
      })
    ).rejects.toBeInstanceOf(NotFoundError);

    // Exercício personalizado de B não pode ser prescrito por A
    const customExB = await createCustomExerciseForTenant(coachB.ctx, {
      categoryId: categories[0]!.id,
      name: "Exercício Secreto do Studio B",
      primaryMuscleGroup: "Peitoral",
    });

    const progA = await createProgramForStudent(coachA.ctx, {
      studentProfileId: studentA1.studentProfileId,
      title: "Programa Legítimo A1",
    });
    const draftA = progA.versions[0]!;
    const dayA = await addTrainingDayToDraft(coachA.ctx, draftA.id, {
      name: "Treino Único",
      dayOfWeek: "MONDAY",
    });

    await expect(
      addExerciseToTrainingDay(coachA.ctx, dayA.id, {
        exerciseId: customExB.id,
        sectionType: "MAIN",
        sets: [{ setNumber: 1, repsTarget: "10", restSeconds: 60 }],
      })
    ).rejects.toBeInstanceOf(NotFoundError);

    // Prescreve exercício global válido
    const wexA = await addExerciseToTrainingDay(coachA.ctx, dayA.id, {
      exerciseId: globals[0]!.id,
      sectionType: "MAIN",
      sets: [{ setNumber: 1, repsTarget: "10", restSeconds: 60 }],
    });

    // Coach B não lê nem altera nada do Coach A (mesmo erro que UUID inexistente)
    const foreignProg = await getProgramForTenant(coachB.ctx, progA.id).catch((e) => e);
    const missingProg = await getProgramForTenant(coachB.ctx, RANDOM_UUID).catch((e) => e);
    expect(foreignProg).toBeInstanceOf(NotFoundError);
    expect(missingProg).toBeInstanceOf(NotFoundError);
    expect(foreignProg.message).toBe(missingProg.message);

    expect(await listProgramsForTenant(coachB.ctx)).toHaveLength(0);

    await expect(
      addTrainingDayToDraft(coachB.ctx, draftA.id, { name: "X", dayOfWeek: "FRIDAY" })
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      addExerciseToTrainingDay(coachB.ctx, dayA.id, {
        exerciseId: globals[0]!.id,
        sectionType: "MAIN",
        sets: [{ setNumber: 1, repsTarget: "10", restSeconds: 60 }],
      })
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(removeWorkoutExerciseFromDraft(coachB.ctx, wexA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    await expect(publishProgramVersion(coachB.ctx, draftA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Aluno A2 não lê programa do Aluno A1 (mesmo dentro do mesmo tenant)
    await expect(getProgramForTenant(studentA2.ctx, progA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Aluno A1 lê o próprio programa, mas não pode executar nenhuma mutação de treinador
    expect((await getProgramForTenant(studentA1.ctx, progA.id)).id).toBe(progA.id);
    await expect(
      createProgramForStudent(studentA1.ctx, {
        studentProfileId: studentA1.studentProfileId,
        title: "Tentativa Aluno",
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(publishProgramVersion(studentA1.ctx, draftA.id)).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("salva versões como WorkoutTemplate reutilizável e aplica em novos rascunhos com isolamento por tenant", async () => {
    await seedExerciseCatalog(prisma);
    const coachA = await createCoach("tplA");
    const coachB = await createCoach("tplB");
    const studentA = await createStudent(coachA.ctx, "stTplA");
    const globals = await listExercisesForTenant(coachA.ctx, { scope: "GLOBAL" });

    const prog1 = await createProgramForStudent(coachA.ctx, {
      studentProfileId: studentA.studentProfileId,
      title: "Base Upper/Lower",
      initialDays: [
        {
          name: "Upper Body",
          dayOfWeek: "MONDAY",
          orderIndex: 0,
          exercises: [
            {
              exerciseId: globals[0]!.id,
              sectionType: "MAIN",
              orderIndex: 0,
              sets: [
                { setNumber: 1, repsTarget: "8-10", suggestedLoadKg: 50, restSeconds: 90 },
                { setNumber: 2, repsTarget: "8-10", suggestedLoadKg: 50, restSeconds: 90 },
              ],
            },
          ],
        },
      ],
    });

    const v1 = prog1.versions[0]!;
    const template = await saveProgramVersionAsTemplate(coachA.ctx, v1.id, {
      title: "Modelo Upper/Lower Padrão",
      category: "Hipertrofia",
    });

    expect((await listWorkoutTemplatesForTenant(coachA.ctx)).map((t) => t.id)).toEqual([
      template.id,
    ]);
    expect(await listWorkoutTemplatesForTenant(coachB.ctx)).toHaveLength(0);

    // Coach B não consegue excluir nem aplicar o template de A
    await expect(
      deleteWorkoutTemplateForTenant(coachB.ctx, template.id)
    ).rejects.toBeInstanceOf(NotFoundError);

    // Coach A cria um segundo programa em branco e aplica o template
    const prog2 = await createProgramForStudent(coachA.ctx, {
      studentProfileId: studentA.studentProfileId,
      title: "Programa Importado do Template",
    });
    const draft2 = prog2.versions[0]!;
    expect(draft2.trainingDays).toHaveLength(0);

    const populatedDraft2 = await applyTemplateToDraftVersion(
      coachA.ctx,
      template.id,
      draft2.id
    );
    expect(populatedDraft2.trainingDays).toHaveLength(1);
    expect(populatedDraft2.trainingDays[0]?.name).toBe("Upper Body");
    expect(populatedDraft2.trainingDays[0]?.workoutExercises[0]?.sets).toHaveLength(2);

    await deleteWorkoutTemplateForTenant(coachA.ctx, template.id);
    expect(await listWorkoutTemplatesForTenant(coachA.ctx)).toHaveLength(0);
  });
});
