import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  analyzeProgressiveOverload,
  applyCopilotSuggestions,
} from "@/modules/copilot/service";
import { seedExerciseCatalog } from "@/modules/exercises/catalog-seed";
import { finishWorkoutSession, startOrResumeWorkoutSession } from "@/modules/sessions/service";
import {
  addExerciseToTrainingDay,
  addTrainingDayToDraft,
  createNewDraftVersion,
  createProgramForStudent,
  publishProgramVersion,
} from "@/modules/workouts/service";
import { NotFoundError, ValidationError } from "@/server/errors";
import { createCoach, createStudent } from "./helpers";

describe("IA Copilot de Periodização e Cargas (Sobrecarga Progressiva)", () => {
  it("sugere aumento de carga (+5%) quando o aluno treina com RPE baixo (<= 7) e aplica no rascunho", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("copilotCoach1");
    const student = await createStudent(coach.ctx, "copilotStudent1");

    const exercise = await prisma.exercise.findFirstOrThrow({
      where: { isGlobal: true },
    });

    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Ciclo de Hipertrofia",
    });

    const v1Draft = program.versions[0];
    const day = await addTrainingDayToDraft(coach.ctx, v1Draft.id, {
      name: "Peito e Tríceps",
      dayOfWeek: "MONDAY",
    });

    await addExerciseToTrainingDay(coach.ctx, day.id, {
      exerciseId: exercise.id,
      sets: [
        { setNumber: 1, repsTarget: "10", suggestedLoadKg: 80 },
        { setNumber: 2, repsTarget: "10", suggestedLoadKg: 80 },
      ],
    });

    await publishProgramVersion(coach.ctx, v1Draft.id);

    // Aluno executa sessões nas últimas semanas com RPE 6.0 (muito fácil) com carga de 80kg
    const session = await startOrResumeWorkoutSession(student.ctx, { trainingDayId: day.id });
    await finishWorkoutSession(student.ctx, {
      sessionId: session.id,
      totalDurationSeconds: 2000,
      perceivedExertionRpe: 6,
      exercises: [
        {
          exerciseId: exercise.id,
          orderIndex: 0,
          isCompleted: true,
          sets: [
            { setNumber: 1, actualLoadKg: 80, actualReps: 10, completed: true, rpe: 6 },
            { setNumber: 2, actualLoadKg: 80, actualReps: 10, completed: true, rpe: 6 },
          ],
        },
      ],
    });

    // Treinador abre uma nova versão (v2) em rascunho
    const v2Draft = await createNewDraftVersion(coach.ctx, program.id);
    const v2Day = v2Draft.trainingDays[0];

    // Executa análise do Copilot
    const analysis = await analyzeProgressiveOverload(coach.ctx, v2Day.id);

    expect(analysis.studentName).toContain("copilotStudent1");
    expect(analysis.suggestions.length).toBe(1);

    const sug = analysis.suggestions[0];
    expect(sug.progressionTier).toBe("PROGRESSION");
    expect(sug.averageRpe).toBe(6.0);
    // 80kg + 5% = 84kg
    expect(sug.suggestedLoadKg).toBe(84);
    expect(sug.rationale).toContain("+5%");

    // Aplica as sugestões na versão v2 em DRAFT
    const applyRes = await applyCopilotSuggestions(coach.ctx, v2Day.id, [
      {
        exerciseId: exercise.id,
        suggestedLoadKg: sug.suggestedLoadKg,
        suggestedReps: "10-12",
      },
    ]);

    expect(applyRes.ok).toBe(true);
    expect(applyRes.updatedSetsCount).toBe(2);

    // Verifica que as séries prescritas no banco foram atualizadas para 84kg
    const updatedSets = await prisma.workoutSetPrescribed.findMany({
      where: { workoutExercise: { trainingDayId: v2Day.id } },
    });
    for (const set of updatedSets) {
      expect(Number(set.suggestedLoadKg)).toBe(84);
      expect(set.repsTarget).toBe("10-12");
    }
  });

  it("sugere deload preventivo quando o aluno opera em RPE de exaustão (>= 9)", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("copilotCoach2");
    const student = await createStudent(coach.ctx, "copilotStudent2");

    const exercise = await prisma.exercise.findFirstOrThrow({
      where: { isGlobal: true },
    });

    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Força Avançada",
    });

    const v1Draft = program.versions[0];
    const day = await addTrainingDayToDraft(coach.ctx, v1Draft.id, {
      name: "Agachamento Pesado",
      dayOfWeek: "TUESDAY",
    });

    await addExerciseToTrainingDay(coach.ctx, day.id, {
      exerciseId: exercise.id,
      sets: [{ setNumber: 1, repsTarget: "5", suggestedLoadKg: 100 }],
    });

    await publishProgramVersion(coach.ctx, v1Draft.id);

    // Aluno executa com RPE 9.5 (quase à falha absoluta)
    const session = await startOrResumeWorkoutSession(student.ctx, { trainingDayId: day.id });
    await finishWorkoutSession(student.ctx, {
      sessionId: session.id,
      totalDurationSeconds: 2400,
      perceivedExertionRpe: 10,
      exercises: [
        {
          exerciseId: exercise.id,
          orderIndex: 0,
          isCompleted: true,
          sets: [{ setNumber: 1, actualLoadKg: 100, actualReps: 5, completed: true, rpe: 10 }],
        },
      ],
    });

    const v2Draft = await createNewDraftVersion(coach.ctx, program.id);
    const v2Day = v2Draft.trainingDays[0];

    const analysis = await analyzeProgressiveOverload(coach.ctx, v2Day.id);
    const sug = analysis.suggestions[0];

    expect(sug.progressionTier).toBe("DELOAD");
    expect(sug.averageRpe).toBe(10);
    // 100kg - 7.5% = 92.5kg
    expect(sug.suggestedLoadKg).toBe(92.5);
    expect(sug.rationale).toContain("redução profilática");
  });

  it("garante isolamento multi-tenant absoluto (anti-IDOR) no Copilot", async () => {
    await seedExerciseCatalog(prisma);
    const coachA = await createCoach("copilotIsoA");
    const coachB = await createCoach("copilotIsoB");
    const studentA = await createStudent(coachA.ctx, "copilotIsoStudentA");

    const exercise = await prisma.exercise.findFirstOrThrow({
      where: { isGlobal: true },
    });

    const programA = await createProgramForStudent(coachA.ctx, {
      studentProfileId: studentA.studentProfileId,
      title: "Treino do Estúdio A",
    });

    const dayA = await addTrainingDayToDraft(coachA.ctx, programA.versions[0].id, {
      name: "Dia A",
      dayOfWeek: "WEDNESDAY",
    });

    await addExerciseToTrainingDay(coachA.ctx, dayA.id, {
      exerciseId: exercise.id,
      sets: [{ setNumber: 1, repsTarget: "10", suggestedLoadKg: 50 }],
    });

    // Treinador B tenta analisar o treino de A -> Deve lançar NotFoundError
    await expect(
      analyzeProgressiveOverload(coachB.ctx, dayA.id)
    ).rejects.toBeInstanceOf(NotFoundError);

    // Treinador B tenta aplicar sugestões no treino de A -> Deve falhar com ValidationError
    await expect(
      applyCopilotSuggestions(coachB.ctx, dayA.id, [
        { exerciseId: exercise.id, suggestedLoadKg: 60, suggestedReps: "12" },
      ])
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
