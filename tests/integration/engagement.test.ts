import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { seedExerciseCatalog } from "@/modules/exercises/catalog-seed";
import {
  dispatchChurnAlerts,
  dispatchMorningWorkoutReminders,
} from "@/modules/notifications/service";
import { finishWorkoutSession, startOrResumeWorkoutSession } from "@/modules/sessions/service";
import {
  addExerciseToTrainingDay,
  addTrainingDayToDraft,
  createProgramForStudent,
  publishProgramVersion,
} from "@/modules/workouts/service";
import { createCoach, createStudent } from "./helpers";

const JS_DOW_TO_ENUM = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

describe("Alertas de Engajamento, Lembrete Matinal e Detecção de Churn", () => {
  it("dispara lembrete matinal para alunos com treino programado para hoje de forma idempotente", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("engCoach1");
    const student = await createStudent(coach.ctx, "engStudent1");

    const todayDow = JS_DOW_TO_ENUM[new Date().getDay()];

    const exercise = await prisma.exercise.findFirstOrThrow({
      where: { isGlobal: true },
    });

    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Hipertrofia Matinal",
    });

    const draft = program.versions[0];
    const day = await addTrainingDayToDraft(coach.ctx, draft.id, {
      name: "Treino do Dia",
      dayOfWeek: todayDow,
    });

    await addExerciseToTrainingDay(coach.ctx, day.id, {
      exerciseId: exercise.id,
      sets: [{ setNumber: 1, repsTarget: "12", suggestedLoadKg: 50 }],
    });

    await publishProgramVersion(coach.ctx, draft.id);

    // 1. Executa o disparo matinal
    const res1 = await dispatchMorningWorkoutReminders();
    expect(res1.dispatchedCount).toBeGreaterThanOrEqual(1);

    // Verifica que a notificação foi persistida para o aluno
    const notifs = await prisma.notification.findMany({
      where: {
        userId: student.userId,
        type: "WORKOUT_ASSIGNED",
        title: { startsWith: "Treino de Hoje:" },
      },
    });
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toContain("Treino de Hoje");

    // 2. Executa novamente: deve ser idempotente (não duplicar no mesmo dia)
    const res2 = await dispatchMorningWorkoutReminders();
    expect(res2.dispatchedCount).toBe(0);
  });

  it("alerta o treinador sobre alunos inativos há mais de 4 dias (prevenção de churn)", async () => {
    const coach = await createCoach("engCoach2");
    const student = await createStudent(coach.ctx, "engStudent2");

    // Simula aluno matriculado há 6 dias sem nenhuma sessão realizada
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    await prisma.studentProfile.update({
      where: { id: student.studentProfileId },
      data: { createdAt: sixDaysAgo },
    });

    // Dispara a checagem de churn
    const res = await dispatchChurnAlerts();
    expect(res.alertsCount).toBeGreaterThanOrEqual(1);

    // O treinador deve ter recebido notificação do tipo CHURN_ALERT
    const alert = await prisma.notification.findFirst({
      where: {
        tenantId: coach.ctx.tenantId,
        userId: coach.ctx.userId,
        type: "CHURN_ALERT",
      },
    });

    expect(alert).toBeDefined();
    expect(alert?.title).toContain("Atenção: Aluno ausente há 6 dias");
    expect(alert?.link).toBe(`/coach/students/${student.studentProfileId}`);

    // Executa novamente: trava de 48h impede envio duplicado
    const repeatRes = await dispatchChurnAlerts();
    expect(repeatRes.alertsCount).toBe(0);
  });

  it("detecta recorde de volume (PR) e RPE elevado ao finalizar treino, notificando o treinador", async () => {
    await seedExerciseCatalog(prisma);
    const coach = await createCoach("engCoach3");
    const student = await createStudent(coach.ctx, "engStudent3");
    const todayDow = JS_DOW_TO_ENUM[new Date().getDay()];

    const exercise = await prisma.exercise.findFirstOrThrow({
      where: { isGlobal: true },
    });

    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId: student.studentProfileId,
      title: "Força Máxima",
    });

    const draft = program.versions[0];
    const day = await addTrainingDayToDraft(coach.ctx, draft.id, {
      name: "Supino Pesado",
      dayOfWeek: todayDow,
    });

    await addExerciseToTrainingDay(coach.ctx, day.id, {
      exerciseId: exercise.id,
      sets: [{ setNumber: 1, repsTarget: "5", suggestedLoadKg: 100 }],
    });

    await publishProgramVersion(coach.ctx, draft.id);

    // Aluno executa uma primeira sessão base (500 kg)
    const session1 = await startOrResumeWorkoutSession(student.ctx, { trainingDayId: day.id });
    await finishWorkoutSession(student.ctx, {
      sessionId: session1.id,
      totalDurationSeconds: 1500,
      perceivedExertionRpe: 7,
      exercises: [
        {
          exerciseId: exercise.id,
          orderIndex: 0,
          isCompleted: true,
          sets: [{ setNumber: 1, actualLoadKg: 50, actualReps: 10, completed: true }],
        },
      ],
    });

    // Aluno inicia uma segunda sessão e bate o recorde com 2.000 kg
    const session2 = await startOrResumeWorkoutSession(student.ctx, { trainingDayId: day.id });
    await finishWorkoutSession(student.ctx, {
      sessionId: session2.id,
      totalDurationSeconds: 3000,
      perceivedExertionRpe: 10,
      studentFeedback: "Bati meu recorde com esforço máximo!",
      exercises: [
        {
          exerciseId: exercise.id,
          orderIndex: 0,
          isCompleted: true,
          sets: [
            { setNumber: 1, actualLoadKg: 100, actualReps: 10, completed: true },
            { setNumber: 2, actualLoadKg: 100, actualReps: 10, completed: true },
          ],
        },
      ],
    });

    // O treinador deve ter recebido a notificação de recorde PR_ACHIEVED
    const coachNotif = await prisma.notification.findFirst({
      where: {
        tenantId: coach.ctx.tenantId,
        userId: coach.ctx.userId,
        type: "PR_ACHIEVED",
      },
    });

    expect(coachNotif).toBeDefined();
    expect(coachNotif?.title).toContain("Novo Recorde de Carga (PR)!");
    expect(coachNotif?.message).toContain("2.000 kg");
  });
});
