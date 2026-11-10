import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getCoachDashboard } from "@/modules/dashboard/service";
import { seedExerciseCatalog } from "@/modules/exercises/catalog-seed";
import { listExercisesForTenant } from "@/modules/exercises/service";
import {
  abandonWorkoutSession,
  finishWorkoutSession,
  getLastPerformanceForExercises,
  getSessionDetails,
  listStudentSessionHistory,
  startOrResumeWorkoutSession,
} from "@/modules/sessions/service";
import {
  addExerciseToTrainingDay,
  addTrainingDayToDraft,
  createProgramForStudent,
  publishProgramVersion,
} from "@/modules/workouts/service";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/server/errors";
import { createCoach, createStudent } from "./helpers";

const RANDOM_UUID = "44444444-4444-4444-8444-444444444444";

describe("Fase 6 — Execução do Treino pelo Aluno e Registro de Sessões", () => {
  it("inicia, retoma, registra cargas, calcula volume total, notifica treinador e finaliza com persistência atômica", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("ses1");
    const student = await createStudent(coach.ctx, "stses1");
    const globals = await listExercisesForTenant(coach.ctx, { scope: "GLOBAL" });
    const supino = globals.find((e) => e.name.includes("Supino Reto"))!;
    const puxada = globals.find((e) => e.name.includes("Puxada Frontal"))!;

    // 1. Treinador prescreve e publica o programa
    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Treino Força e Volume",
    });
    const draft = program.versions[0]!;

    const dayA = await addTrainingDayToDraft(coach.ctx, draft.id, {
      name: "Treino A — Peito e Costas",
      dayOfWeek: "MONDAY",
    });

    const wexSupino = await addExerciseToTrainingDay(coach.ctx, dayA.id, {
      exerciseId: supino.id,
      sectionType: "MAIN",
      sets: [
        { setNumber: 1, repsTarget: "10", suggestedLoadKg: 50, restSeconds: 60 },
        { setNumber: 2, repsTarget: "10", suggestedLoadKg: 50, restSeconds: 60 },
      ],
    });

    const wexPuxada = await addExerciseToTrainingDay(coach.ctx, dayA.id, {
      exerciseId: puxada.id,
      sectionType: "MAIN",
      sets: [
        { setNumber: 1, repsTarget: "12", suggestedLoadKg: 40, restSeconds: 60 },
      ],
    });

    await publishProgramVersion(coach.ctx, draft.id);

    // 2. Aluno inicia a sessão
    const session = await startOrResumeWorkoutSession(student.ctx, {
      trainingDayId: dayA.id,
    });
    expect(session.status).toBe("IN_PROGRESS");
    expect(session.studentProfileId).toBe(student.studentProfileId);
    expect(session.exerciseLogs).toHaveLength(2);

    // Retomada: chamar novamente retorna a mesma sessão sem duplicar
    const resumed = await startOrResumeWorkoutSession(student.ctx, {
      trainingDayId: dayA.id,
    });
    expect(resumed.id).toBe(session.id);

    // 3. Antes de finalizar, histórico anterior para os exercícios está vazio
    const initialPerf = await getLastPerformanceForExercises(student.ctx, [
      supino.id,
      puxada.id,
    ]);
    expect(initialPerf[supino.id]).toBeUndefined();

    // 4. Aluno executa as séries e finaliza o treino
    // Volume esperado: (50kg * 10) + (55kg * 10) + (45kg * 12) = 500 + 550 + 540 = 1590 kg
    const finished = await finishWorkoutSession(student.ctx, {
      sessionId: session.id,
      totalDurationSeconds: 2700, // 45 minutos
      perceivedExertionRpe: 8,
      studentFeedback: "Treino intenso, aumentei a segunda série de supino para 55kg.",
      exercises: [
        {
          exerciseId: supino.id,
          workoutExerciseId: wexSupino.id,
          orderIndex: 0,
          isCompleted: true,
          sets: [
            {
              setNumber: 1,
              prescribedLoadKg: 50,
              actualLoadKg: 50,
              prescribedReps: "10",
              actualReps: 10,
              completed: true,
              restTakenSeconds: 60,
              rpe: 7.5,
            },
            {
              setNumber: 2,
              prescribedLoadKg: 50,
              actualLoadKg: 55,
              prescribedReps: "10",
              actualReps: 10,
              completed: true,
              restTakenSeconds: 75,
              rpe: 8.5,
            },
          ],
        },
        {
          exerciseId: puxada.id,
          workoutExerciseId: wexPuxada.id,
          orderIndex: 1,
          isCompleted: true,
          sets: [
            {
              setNumber: 1,
              prescribedLoadKg: 40,
              actualLoadKg: 45,
              prescribedReps: "12",
              actualReps: 12,
              completed: true,
              restTakenSeconds: 60,
              rpe: 8,
            },
          ],
        },
      ],
    });

    expect(finished.status).toBe("COMPLETED");
    expect(finished.completedAt).not.toBeNull();
    expect(Number(finished.totalVolumeKg)).toBe(1590);
    expect(finished.totalDurationSeconds).toBe(2700);
    expect(finished.perceivedExertionRpe).toBe(8);

    // Tentativa de finalizar novamente dispara ConflictError
    await expect(
      finishWorkoutSession(student.ctx, {
        sessionId: session.id,
        totalDurationSeconds: 3000,
        exercises: [
          {
            exerciseId: supino.id,
            sets: [{ setNumber: 1, actualLoadKg: 50, actualReps: 10, completed: true }],
          },
        ],
      })
    ).rejects.toBeInstanceOf(ConflictError);

    // 5. Histórico da última carga agora retorna exatamente as cargas executadas nesta sessão
    const nextPerf = await getLastPerformanceForExercises(student.ctx, [supino.id]);
    expect(nextPerf[supino.id]).toBeDefined();
    expect(nextPerf[supino.id]?.map((s) => ({ set: s.setNumber, load: s.loadKg, reps: s.reps }))).toEqual([
      { set: 1, load: 50, reps: 10 },
      { set: 2, load: 55, reps: 10 },
    ]);

    // 6. Treinador recebeu notificação e o dashboard contabiliza a sessão desta semana
    const notifications = await prisma.notification.findMany({
      where: { tenantId: coach.ctx.tenantId, type: "WORKOUT_COMPLETED" },
    });
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0]?.message).toContain("1.590 kg");

    const dash = await getCoachDashboard(coach.ctx);
    expect(dash.sessionsThisWeek).toBe(1);
    expect(dash.recentActivity[0]?.workoutName).toBe("Treino A — Peito e Costas");
    expect(dash.recentActivity[0]?.totalVolumeKg).toBe(1590);

    // 7. Sessão aparece no histórico do aluno
    const history = await listStudentSessionHistory(student.ctx);
    expect(history).toHaveLength(1);
    expect(history[0]?.id).toBe(session.id);
    expect(Number(history[0]?.totalVolumeKg)).toBe(1590);
  });

  it("permite descartar uma sessão em andamento mas bloqueia descarte de sessão já concluída", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("sesAb");
    const student = await createStudent(coach.ctx, "stAb");
    const globals = await listExercisesForTenant(coach.ctx, { scope: "GLOBAL" });

    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Treino Abandono",
    });
    const draft = program.versions[0]!;
    const day = await addTrainingDayToDraft(coach.ctx, draft.id, {
      name: "Treino Abandono",
      dayOfWeek: "FRIDAY",
    });
    await addExerciseToTrainingDay(coach.ctx, day.id, {
      exerciseId: globals[0]!.id,
      sets: [{ setNumber: 1, repsTarget: "10", restSeconds: 60 }],
    });
    await publishProgramVersion(coach.ctx, draft.id);

    const session = await startOrResumeWorkoutSession(student.ctx, {
      trainingDayId: day.id,
    });
    expect(session.status).toBe("IN_PROGRESS");

    const abandoned = await abandonWorkoutSession(student.ctx, session.id);
    expect(abandoned.status).toBe("ABANDONED");

    // Iniciar novamente cria uma nova sessão porque a anterior foi abandonada
    const newSession = await startOrResumeWorkoutSession(student.ctx, {
      trainingDayId: day.id,
    });
    expect(newSession.id).not.toBe(session.id);
    expect(newSession.status).toBe("IN_PROGRESS");

    // Conclui a nova sessão e tenta abandoná-la -> ConflictError
    await finishWorkoutSession(student.ctx, {
      sessionId: newSession.id,
      totalDurationSeconds: 1200,
      exercises: [
        {
          exerciseId: globals[0]!.id,
          sets: [{ setNumber: 1, actualLoadKg: 20, actualReps: 10, completed: true }],
        },
      ],
    });

    await expect(abandonWorkoutSession(student.ctx, newSession.id)).rejects.toBeInstanceOf(
      ConflictError
    );
  });

  it("garante isolamento multi-tenant (anti-IDOR) e restrições de papel em sessões", async () => {
    await seedExerciseCatalog(prisma);
    const coachA = await createCoach("sIsoA");
    const coachB = await createCoach("sIsoB");
    const studentA = await createStudent(coachA.ctx, "stIsoA");
    const studentB = await createStudent(coachB.ctx, "stIsoB");
    const globals = await listExercisesForTenant(coachA.ctx, { scope: "GLOBAL" });

    const progA = await createProgramForStudent(coachA.ctx, {
      studentProfileId: studentA.studentProfileId,
      title: "Treino Aluno A",
    });
    const draftA = progA.versions[0]!;
    const dayA = await addTrainingDayToDraft(coachA.ctx, draftA.id, {
      name: "Treino Dia A",
      dayOfWeek: "MONDAY",
    });
    await addExerciseToTrainingDay(coachA.ctx, dayA.id, {
      exerciseId: globals[0]!.id,
      sets: [{ setNumber: 1, repsTarget: "10", restSeconds: 60 }],
    });
    await publishProgramVersion(coachA.ctx, draftA.id);

    // Aluno B tenta iniciar sessão no treino de A -> NotFoundError
    await expect(
      startOrResumeWorkoutSession(studentB.ctx, { trainingDayId: dayA.id })
    ).rejects.toBeInstanceOf(NotFoundError);

    // Aluno A inicia sua sessão
    const sessionA = await startOrResumeWorkoutSession(studentA.ctx, {
      trainingDayId: dayA.id,
    });

    // Aluno B não consegue ler os detalhes da sessão de A (mesmo erro que UUID aleatório)
    const foreignRead = await getSessionDetails(studentB.ctx, sessionA.id).catch((e) => e);
    const missingRead = await getSessionDetails(studentB.ctx, RANDOM_UUID).catch((e) => e);
    expect(foreignRead).toBeInstanceOf(NotFoundError);
    expect(missingRead).toBeInstanceOf(NotFoundError);
    expect(foreignRead.message).toBe(missingRead.message);

    // Aluno B não consegue finalizar nem abandonar a sessão de A
    await expect(
      finishWorkoutSession(studentB.ctx, {
        sessionId: sessionA.id,
        totalDurationSeconds: 1000,
        exercises: [
          {
            exerciseId: globals[0]!.id,
            sets: [{ setNumber: 1, actualLoadKg: 10, actualReps: 10, completed: true }],
          },
        ],
      })
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(abandonWorkoutSession(studentB.ctx, sessionA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Coach B não consegue ver a sessão de A
    await expect(getSessionDetails(coachB.ctx, sessionA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Coach A consegue inspecionar os detalhes da sessão do seu aluno A
    const coachRead = await getSessionDetails(coachA.ctx, sessionA.id);
    expect(coachRead.id).toBe(sessionA.id);

    // Treinador não pode finalizar a sessão fingindo ser o aluno (assertStudent)
    await expect(
      finishWorkoutSession(coachA.ctx, {
        sessionId: sessionA.id,
        totalDurationSeconds: 1000,
        exercises: [
          {
            exerciseId: globals[0]!.id,
            sets: [{ setNumber: 1, actualLoadKg: 10, actualReps: 10, completed: true }],
          },
        ],
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
