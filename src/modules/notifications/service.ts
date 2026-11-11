import { prisma } from "@/lib/db";
import { type TenantContext } from "@/server/auth/context";
import { CreateNotificationInput, PushSubscriptionInput } from "./types";

const JS_DOW_TO_ENUM = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

/**
 * Salva ou atualiza uma inscrição de Web Push para o usuário logado.
 */
export async function registerPushSubscription(
  ctx: TenantContext,
  input: PushSubscriptionInput
) {
  return prisma.pushSubscription.upsert({
    where: {
      endpoint: input.endpoint,
    },
    update: {
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      updatedAt: new Date(),
    },
    create: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
    },
  });
}

/**
 * Remove uma inscrição de Web Push (ex: ao deslogar ou revogar permissão).
 */
export async function removePushSubscription(
  ctx: TenantContext,
  endpoint: string
) {
  return prisma.pushSubscription.deleteMany({
    where: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      endpoint,
    },
  });
}

/**
 * Cria uma notificação in-app no banco para o usuário e dispara Web Push se inscrito.
 */
export async function createNotification(
  tenantId: string,
  input: CreateNotificationInput
) {
  const notification = await prisma.notification.create({
    data: {
      tenantId,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link,
    },
  });

  return notification;
}

/**
 * Dispara lembretes matinais para alunos que possuem treino programado no dia de hoje.
 */
export async function dispatchMorningWorkoutReminders() {
  const todayDow = JS_DOW_TO_ENUM[new Date().getDay()];

  // Busca todos os programas ativos que possuem versão publicada com dia no DOW de hoje
  const activePrograms = await prisma.trainingProgram.findMany({
    where: {
      isActive: true,
      versions: {
        some: {
          status: "PUBLISHED",
          trainingDays: {
            some: { dayOfWeek: todayDow },
          },
        },
      },
    },
    select: {
      tenantId: true,
      studentProfile: {
        select: {
          id: true,
          userId: true,
          user: { select: { name: true, email: true } },
        },
      },
      versions: {
        where: { status: "PUBLISHED" },
        take: 1,
        orderBy: { versionNumber: "desc" },
        select: {
          trainingDays: {
            where: { dayOfWeek: todayDow },
            select: { name: true },
          },
        },
      },
    },
  });

  let dispatchedCount = 0;

  for (const prog of activePrograms) {
    const studentUser = prog.studentProfile.user;
    const trainingDay = prog.versions[0]?.trainingDays[0];
    if (!studentUser || !trainingDay) continue;

    const firstName = studentUser.name?.split(" ")[0] || "Aluno";
    const title = `Treino de Hoje: ${trainingDay.name}`;
    const message = `Bom dia, ${firstName}! Seu treino "${trainingDay.name}" está agendado para hoje. Bora treinar?`;

    // Evita duplicar lembrete no mesmo dia
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const alreadySent = await prisma.notification.findFirst({
      where: {
        tenantId: prog.tenantId,
        userId: prog.studentProfile.userId,
        type: "WORKOUT_ASSIGNED",
        title: { startsWith: "Treino de Hoje:" },
        createdAt: { gte: todayStart },
      },
    });

    if (!alreadySent) {
      await createNotification(prog.tenantId, {
        userId: prog.studentProfile.userId,
        title,
        message,
        type: "WORKOUT_ASSIGNED",
        link: "/student/today",
      });
      dispatchedCount++;
    }
  }

  return { dispatchedCount };
}

/**
 * Alerta o treinador sobre alunos inativos há mais de 4 dias (prevenção ativa de churn).
 */
export async function dispatchChurnAlerts() {
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

  // Busca todos os alunos ativos
  const activeStudents = await prisma.studentProfile.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      tenantId: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      tenant: {
        select: {
          members: {
            where: { role: { in: ["OWNER", "COACH"] } },
            select: { userId: true },
          },
        },
      },
      workoutSessions: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true },
      },
    },
  });

  let alertsCount = 0;

  for (const student of activeStudents) {
    const lastSession = student.workoutSessions[0];
    const lastActivity = lastSession?.completedAt || student.createdAt;

    if (lastActivity < fourDaysAgo) {
      const daysInactive = Math.floor(
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      const coachMembers = student.tenant.members;
      const studentName = student.user.name || student.user.email;

      for (const coach of coachMembers) {
        // Evita spam de alerta repetido nas últimas 48 horas
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const existingAlert = await prisma.notification.findFirst({
          where: {
            tenantId: student.tenantId,
            userId: coach.userId,
            type: "CHURN_ALERT",
            link: `/coach/students/${student.id}`,
            createdAt: { gte: twoDaysAgo },
          },
        });

        if (!existingAlert) {
          await createNotification(student.tenantId, {
            userId: coach.userId,
            title: `Atenção: Aluno ausente há ${daysInactive} dias`,
            message: `${studentName} não registra treinos há ${daysInactive} dias. Que tal enviar uma mensagem de acompanhamento?`,
            type: "CHURN_ALERT",
            link: `/coach/students/${student.id}`,
          });
          alertsCount++;
        }
      }
    }
  }

  return { alertsCount };
}

/**
 * Notifica o treinador assim que uma sessão é finalizada pelo aluno
 * se houver recorde de volume ou RPE elevado (>= 9).
 */
export async function notifyCoachOnSessionFinish(params: {
  tenantId: string;
  studentProfileId: string;
  dayName: string;
  totalVolumeKg: number;
  rpe?: number;
}) {
  const { tenantId, studentProfileId, dayName, totalVolumeKg, rpe } = params;

  const [student, coachMembers, previousSessions] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { user: { select: { name: true } } },
    }),
    prisma.tenantMember.findMany({
      where: {
        tenantId,
        role: { in: ["OWNER", "COACH"] },
      },
      select: { userId: true },
    }),
    prisma.workoutSession.findMany({
      where: {
        tenantId,
        studentProfileId,
        status: "COMPLETED",
      },
      select: { totalVolumeKg: true },
      orderBy: { totalVolumeKg: "desc" },
      take: 2,
    }),
  ]);

  if (!student || coachMembers.length === 0) return;

  const studentName = student.user.name || "Aluno";
  const isHighRpe = (rpe ?? 0) >= 9;

  // Verifica se esta sessão bateu o recorde de volume anterior
  const previousMax = previousSessions.length > 1
    ? Number(previousSessions[1].totalVolumeKg ?? 0)
    : 0;
  const isRecordVolume = totalVolumeKg > 0 && totalVolumeKg > previousMax;

  for (const coach of coachMembers) {
    if (isRecordVolume) {
      await createNotification(tenantId, {
        userId: coach.userId,
        title: `Novo Recorde de Carga: ${studentName}!`,
        message: `${studentName} atingiu uma nova tonelagem recorde de ${totalVolumeKg.toLocaleString("pt-BR")} kg no treino ${dayName}!`,
        type: "PR_ACHIEVED",
        link: `/coach/students/${studentProfileId}`,
      });
    } else if (isHighRpe) {
      await createNotification(tenantId, {
        userId: coach.userId,
        title: `Treino Intenso Concluído: ${studentName}`,
        message: `${studentName} finalizou o treino ${dayName} com esforço quase máximo (RPE ${rpe}/10). Acompanhe a recuperação!`,
        type: "WORKOUT_COMPLETED",
        link: `/coach/students/${studentProfileId}`,
      });
    }
  }
}
