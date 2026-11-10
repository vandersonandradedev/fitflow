import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { seedExerciseCatalog } from "@/modules/exercises/catalog-seed";
import { listExercisesForTenant } from "@/modules/exercises/service";
import {
  deletePhysicalAssessment,
  getBodyCompositionProgression,
  getExerciseProgressionStats,
  getMuscleGroupVolumeStats,
  getWeeklyAdherenceStats,
  listPhysicalAssessments,
  recordPhysicalAssessment,
} from "@/modules/progress/service";
import {
  finishWorkoutSession,
  startOrResumeWorkoutSession,
} from "@/modules/sessions/service";
import {
  addExerciseToTrainingDay,
  addTrainingDayToDraft,
  createProgramForStudent,
  publishProgramVersion,
} from "@/modules/workouts/service";
import { NotFoundError } from "@/server/errors";
import { createCoach, createStudent } from "./helpers";

const RANDOM_UUID = "55555555-5555-4555-8555-555555555555";

describe("Fase 7 — Acompanhamento, Evolução Física e Inteligência de Dados", () => {
  it("registra avaliações físicas, gera histórico de composição corporal e permite exclusão controlada", async () => {
    const coach = await createCoach("prg1");
    const student = await createStudent(coach.ctx, "stPrg1");

    // Registra primeira avaliação física
    const a1 = await recordPhysicalAssessment(coach.ctx, {
      studentProfileId: student.studentProfileId,
      assessmentDate: "2026-10-01",
      weightKg: 82.5,
      heightCm: 180,
      bodyFatPercentage: 18.5,
      muscleMassPercentage: 38.0,
      waistCm: 86.0,
      chestCm: 102.0,
      rightArmCm: 36.5,
      notes: "Avaliação inicial de entrada.",
    });

    expect(Number(a1.weightKg)).toBe(82.5);
    expect(a1.measurements).toHaveLength(1);
    expect(Number(a1.measurements[0]?.waistCm)).toBe(86.0);

    // Registra segunda avaliação após 30 dias (evolução)
    const a2 = await recordPhysicalAssessment(coach.ctx, {
      studentProfileId: student.studentProfileId,
      assessmentDate: "2026-11-01",
      weightKg: 80.0,
      heightCm: 180,
      bodyFatPercentage: 16.0,
      muscleMassPercentage: 39.5,
      waistCm: 83.0,
      chestCm: 104.0,
      rightArmCm: 37.5,
      notes: "Redução de cintura e ganho de braço.",
    });

    // Lista em ordem decrescente de data
    const list = await listPhysicalAssessments(coach.ctx, student.studentProfileId);
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe(a2.id);
    expect(list[1]?.id).toBe(a1.id);

    // Consulta de progressão para gráficos (ordem cronológica crescente)
    const progression = await getBodyCompositionProgression(
      coach.ctx,
      student.studentProfileId
    );
    expect(progression).toHaveLength(2);
    expect(progression[0]?.weightKg).toBe(82.5);
    expect(progression[0]?.bodyFatPercentage).toBe(18.5);
    expect(progression[1]?.weightKg).toBe(80.0);
    expect(progression[1]?.bodyFatPercentage).toBe(16.0);

    // Exclusão da avaliação a1
    await deletePhysicalAssessment(coach.ctx, a1.id);
    const afterDelete = await listPhysicalAssessments(
      coach.ctx,
      student.studentProfileId
    );
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0]?.id).toBe(a2.id);
  });

  it("calcula adesão semanal, sobrecarga progressiva (1RM Epley) e tonelagem muscular por categoria", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("prg2");
    const student = await createStudent(coach.ctx, "stPrg2");
    const globals = await listExercisesForTenant(coach.ctx, { scope: "GLOBAL" });
    const supino = globals.find((e) => e.name.includes("Supino Reto"))!;
    const puxada = globals.find((e) => e.name.includes("Puxada Frontal"))!;

    // Configura e publica programa para o aluno
    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Programa Hipertrofia Progressiva",
    });
    const draft = program.versions[0]!;

    const dayA = await addTrainingDayToDraft(coach.ctx, draft.id, {
      name: "Dia A — Peito e Costas",
      dayOfWeek: "MONDAY",
    });

    const wexSupino = await addExerciseToTrainingDay(coach.ctx, dayA.id, {
      exerciseId: supino.id,
      sets: [{ setNumber: 1, repsTarget: "8-10", restSeconds: 60 }],
    });
    const wexPuxada = await addExerciseToTrainingDay(coach.ctx, dayA.id, {
      exerciseId: puxada.id,
      sets: [{ setNumber: 1, repsTarget: "10-12", restSeconds: 60 }],
    });
    await publishProgramVersion(coach.ctx, draft.id);

    // Sessão 1: Supino 60kg x 10 reps, Puxada 50kg x 10 reps
    const s1 = await startOrResumeWorkoutSession(student.ctx, { trainingDayId: dayA.id });
    await finishWorkoutSession(student.ctx, {
      sessionId: s1.id,
      totalDurationSeconds: 1800,
      exercises: [
        {
          exerciseId: supino.id,
          workoutExerciseId: wexSupino.id,
          sets: [{ setNumber: 1, actualLoadKg: 60, actualReps: 10, completed: true }],
        },
        {
          exerciseId: puxada.id,
          workoutExerciseId: wexPuxada.id,
          sets: [{ setNumber: 1, actualLoadKg: 50, actualReps: 10, completed: true }],
        },
      ],
    });

    // Força a data da sessão 1 para ontem para testar progressão entre dias distintos
    await prisma.workoutSession.update({
      where: { id: s1.id },
      data: { completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // Sessão 2: Supino 70kg x 8 reps, Puxada 55kg x 10 reps
    const s2 = await startOrResumeWorkoutSession(student.ctx, { trainingDayId: dayA.id });
    await finishWorkoutSession(student.ctx, {
      sessionId: s2.id,
      totalDurationSeconds: 2000,
      exercises: [
        {
          exerciseId: supino.id,
          workoutExerciseId: wexSupino.id,
          sets: [{ setNumber: 1, actualLoadKg: 70, actualReps: 8, completed: true }],
        },
        {
          exerciseId: puxada.id,
          workoutExerciseId: wexPuxada.id,
          sets: [{ setNumber: 1, actualLoadKg: 55, actualReps: 10, completed: true }],
        },
      ],
    });

    // 1. Testa cálculo de sobrecarga progressiva e 1RM estimada (Fórmula de Epley)
    const progSupino = await getExerciseProgressionStats(
      coach.ctx,
      supino.id,
      student.studentProfileId
    );
    expect(progSupino.points).toHaveLength(2);

    // Ponto 1: 60kg x 10 reps -> 1RM = 60 * (1 + 10/30) = 80 kg
    expect(progSupino.points[0]?.maxLoadKg).toBe(60);
    expect(progSupino.points[0]?.estimated1RmKg).toBe(80);

    // Ponto 2: 70kg x 8 reps -> 1RM = 70 * (1 + 8/30) = 88.7 kg
    expect(progSupino.points[1]?.maxLoadKg).toBe(70);
    expect(progSupino.points[1]?.estimated1RmKg).toBe(88.7);

    // 2. Testa distribuição de volume por categoria muscular
    const volumeStats = await getMuscleGroupVolumeStats(
      coach.ctx,
      student.studentProfileId,
      4
    );
    // Peito: (60*10) + (70*8) = 600 + 560 = 1160 kg
    // Costas: (50*10) + (55*10) = 500 + 550 = 1050 kg
    const peito = volumeStats.find((v) => v.groupName === "Peito");
    const costas = volumeStats.find((v) => v.groupName === "Costas");
    expect(peito?.totalVolumeKg).toBe(1160);
    expect(costas?.totalVolumeKg).toBe(1050);

    // 3. Testa adesão semanal
    const adherence = await getWeeklyAdherenceStats(
      coach.ctx,
      student.studentProfileId,
      4
    );
    expect(adherence.length).toBe(4);
    const lastWeek = adherence[adherence.length - 1]!;
    expect(lastWeek.completedSessions).toBeGreaterThanOrEqual(1);
  });

  it("garante isolamento multi-tenant (anti-IDOR) nas avaliações e gráficos de evolução", async () => {
    const coachA = await createCoach("prgIsoA");
    const coachB = await createCoach("prgIsoB");
    const studentA = await createStudent(coachA.ctx, "stPrgIsoA");
    const studentB = await createStudent(coachB.ctx, "stPrgIsoB");

    // Coach A registra avaliação para o Aluno A
    const aA = await recordPhysicalAssessment(coachA.ctx, {
      studentProfileId: studentA.studentProfileId,
      weightKg: 75.0,
      bodyFatPercentage: 15.0,
    });

    // Coach B não consegue registrar avaliação para o Aluno A
    await expect(
      recordPhysicalAssessment(coachB.ctx, {
        studentProfileId: studentA.studentProfileId,
        weightKg: 70.0,
      })
    ).rejects.toBeInstanceOf(NotFoundError);

    // Coach B não consegue ler nem excluir a avaliação do Aluno A (mesmo erro que UUID inexistente)
    const foreignList = await listPhysicalAssessments(coachB.ctx, studentA.studentProfileId).catch(
      (e) => e
    );
    const missingList = await listPhysicalAssessments(coachB.ctx, RANDOM_UUID).catch((e) => e);
    expect(foreignList).toBeInstanceOf(NotFoundError);
    expect(missingList).toBeInstanceOf(NotFoundError);

    await expect(deletePhysicalAssessment(coachB.ctx, aA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Coach B não consulta métricas do Aluno A
    await expect(
      getWeeklyAdherenceStats(coachB.ctx, studentA.studentProfileId)
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      getMuscleGroupVolumeStats(coachB.ctx, studentA.studentProfileId)
    ).rejects.toBeInstanceOf(NotFoundError);

    // Aluno B não consulta métricas do Aluno A
    await expect(
      getBodyCompositionProgression(studentB.ctx, studentA.studentProfileId)
    ).rejects.toBeInstanceOf(NotFoundError);

    // Aluno A consulta as próprias avaliações com sucesso
    const ownProgression = await getBodyCompositionProgression(studentA.ctx);
    expect(ownProgression).toHaveLength(1);
    expect(ownProgression[0]?.weightKg).toBe(75.0);
  });
});
