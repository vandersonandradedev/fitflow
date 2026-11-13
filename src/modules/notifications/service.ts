import { prisma } from "@/lib/db";
import { getBrazilDayOfWeek, getStartOfBrazilDay } from "@/lib/date";
import { type TenantContext } from "@/server/auth/context";
import { sendPushToUser } from "@/server/notifications/push";
import { AIEngagementAgent } from "@/modules/ai/engagement-agent";
import { CreateNotificationInput, PushSubscriptionInput } from "./types";

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

  // Dispara Push Notification em background para o celular/dispositivo do usuário
  sendPushToUser(input.userId, {
    title: input.title,
    body: input.message,
    url: input.link,
  }).catch((err) => {
    console.error("[push] Falha ao disparar push em createNotification:", err);
  });

  return notification;
}

/**
 * Dispara lembretes matinais para alunos que possuem treino programado no dia de hoje.
 * Utiliza o Agente Autônomo de Engajamento para gerar mensagens dinâmicas e motivadoras.
 */
export async function dispatchMorningWorkoutReminders() {
  const todayDow = getBrazilDayOfWeek();

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
          fitnessGoal: true,
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

    // Evita duplicar lembrete no mesmo dia (início do dia no fuso de Brasília)
    const todayStart = getStartOfBrazilDay();

    const alreadySent = await prisma.notification.findFirst({
      where: {
        tenantId: prog.tenantId,
        userId: prog.studentProfile.userId,
        type: "WORKOUT_ASSIGNED",
        title: { contains: "Treino" },
        createdAt: { gte: todayStart },
      },
    });

    if (!alreadySent) {
      const aiMsg = await AIEngagementAgent.getMorningWorkoutReminder({
        studentName: studentUser.name || "Aluno",
        fitnessGoal: prog.studentProfile.fitnessGoal,
        todaysWorkoutName: trainingDay.name,
      });

      await createNotification(prog.tenantId, {
        userId: prog.studentProfile.userId,
        title: aiMsg.title,
        message: aiMsg.message,
        type: "WORKOUT_ASSIGNED",
        link: "/student/today",
      });
      dispatchedCount++;
    }
  }

  return { dispatchedCount };
}

/**
 * Dispara lembrete de fim de tarde (17h/18h) exclusivamente para alunos com treino hoje
 * que AINDA NÃO registraram o treino concluído no sistema.
 */
export async function dispatchEveningWorkoutReminders() {
  const todayDow = getBrazilDayOfWeek();
  const todayStart = getStartOfBrazilDay();

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
          fitnessGoal: true,
          user: { select: { name: true, email: true } },
          workoutSessions: {
            where: {
              status: "COMPLETED",
              completedAt: { gte: todayStart },
            },
            take: 1,
            select: { id: true },
          },
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
    // Aluno já treinou hoje: missão cumprida, sem cobrança!
    if (prog.studentProfile.workoutSessions.length > 0) continue;

    const studentUser = prog.studentProfile.user;
    const trainingDay = prog.versions[0]?.trainingDays[0];
    if (!studentUser || !trainingDay) continue;

    // Evita duplicar lembrete de encerramento no mesmo dia
    const alreadySent = await prisma.notification.findFirst({
      where: {
        tenantId: prog.tenantId,
        userId: prog.studentProfile.userId,
        type: "WORKOUT_ASSIGNED",
        title: { startsWith: "Ainda dá tempo" },
        createdAt: { gte: todayStart },
      },
    });

    if (!alreadySent) {
      const aiMsg = await AIEngagementAgent.getEveningPendingWorkoutReminder({
        studentName: studentUser.name || "Aluno",
        fitnessGoal: prog.studentProfile.fitnessGoal,
        todaysWorkoutName: trainingDay.name,
      });

      await createNotification(prog.tenantId, {
        userId: prog.studentProfile.userId,
        title: aiMsg.title,
        message: aiMsg.message,
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

/**
 * Dispara lembretes de hidratação (água) para alunos ativos.
 * Evita repetição nas últimas 3.5 horas.
 */
export async function dispatchWaterReminders() {
  const cutoff = new Date(Date.now() - 3.5 * 60 * 60 * 1000);
  const activeStudents = await prisma.studentProfile.findMany({
    where: { status: "ACTIVE" },
    select: {
      tenantId: true,
      userId: true,
      fitnessGoal: true,
      user: { select: { name: true } },
    },
  });

  let dispatchedCount = 0;

  for (const student of activeStudents) {
    const alreadySent = await prisma.notification.findFirst({
      where: {
        tenantId: student.tenantId,
        userId: student.userId,
        title: { contains: "Hidrat" },
        createdAt: { gte: cutoff },
      },
    });

    if (!alreadySent) {
      const aiMsg = await AIEngagementAgent.getWaterReminder({
        studentName: student.user.name || "Aluno",
        fitnessGoal: student.fitnessGoal,
      });

      await createNotification(student.tenantId, {
        userId: student.userId,
        title: aiMsg.title,
        message: aiMsg.message,
        type: "SYSTEM",
        link: "/student/today",
      });
      dispatchedCount++;
    }
  }

  return { dispatchedCount };
}

/**
 * Dispara lembretes de nutrição e alimentação para alunos ativos.
 * Evita repetição no mesmo dia.
 */
export async function dispatchNutritionReminders() {
  const todayStart = getStartOfBrazilDay();
  const activeStudents = await prisma.studentProfile.findMany({
    where: { status: "ACTIVE" },
    select: {
      tenantId: true,
      userId: true,
      fitnessGoal: true,
      user: { select: { name: true } },
    },
  });

  let dispatchedCount = 0;

  for (const student of activeStudents) {
    const alreadySent = await prisma.notification.findFirst({
      where: {
        tenantId: student.tenantId,
        userId: student.userId,
        title: { contains: "Nutri" },
        createdAt: { gte: todayStart },
      },
    });

    if (!alreadySent) {
      const aiMsg = await AIEngagementAgent.getNutritionReminder({
        studentName: student.user.name || "Aluno",
        fitnessGoal: student.fitnessGoal,
      });

      await createNotification(student.tenantId, {
        userId: student.userId,
        title: aiMsg.title,
        message: aiMsg.message,
        type: "SYSTEM",
        link: "/student/today",
      });
      dispatchedCount++;
    }
  }

  return { dispatchedCount };
}

/**
 * Dispara lembretes noturnos de higiene do sono e descanso para alunos ativos.
 * Evita repetição no mesmo dia.
 */
export async function dispatchSleepReminders() {
  const todayStart = getStartOfBrazilDay();
  const activeStudents = await prisma.studentProfile.findMany({
    where: { status: "ACTIVE" },
    select: {
      tenantId: true,
      userId: true,
      fitnessGoal: true,
      user: { select: { name: true } },
    },
  });

  let dispatchedCount = 0;

  for (const student of activeStudents) {
    const alreadySent = await prisma.notification.findFirst({
      where: {
        tenantId: student.tenantId,
        userId: student.userId,
        title: { contains: "Sono" },
        createdAt: { gte: todayStart },
      },
    });

    if (!alreadySent) {
      const aiMsg = await AIEngagementAgent.getSleepReminder({
        studentName: student.user.name || "Aluno",
        fitnessGoal: student.fitnessGoal,
      });

      await createNotification(student.tenantId, {
        userId: student.userId,
        title: aiMsg.title,
        message: aiMsg.message,
        type: "SYSTEM",
        link: "/student/today",
      });
      dispatchedCount++;
    }
  }

  return { dispatchedCount };
}

/**
 * Orquestrador inteligente de hábitos saudáveis e engajamento dinâmico.
 * Seleciona automaticamente o tipo de notificação ideal de acordo com a hora local (Brasília).
 */
export async function dispatchHabitReminders(
  mode: "AUTO" | "WATER" | "NUTRITION" | "SLEEP" | "EVENING" | "ALL" = "AUTO"
) {
  if (mode === "WATER") {
    return dispatchWaterReminders();
  }
  if (mode === "NUTRITION") {
    return dispatchNutritionReminders();
  }
  if (mode === "SLEEP") {
    return dispatchSleepReminders();
  }
  if (mode === "EVENING") {
    return dispatchEveningWorkoutReminders();
  }
  if (mode === "ALL") {
    const [water, nutrition, sleep, evening] = await Promise.all([
      dispatchWaterReminders(),
      dispatchNutritionReminders(),
      dispatchSleepReminders(),
      dispatchEveningWorkoutReminders(),
    ]);
    return {
      waterDispatched: water.dispatchedCount,
      nutritionDispatched: nutrition.dispatchedCount,
      sleepDispatched: sleep.dispatchedCount,
      eveningDispatched: evening.dispatchedCount,
    };
  }

  // Modo AUTO: determina o lembrete adequado pelo fuso horário de Brasília
  const now = new Date();
  const brazilHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now)
  );

  if (brazilHour >= 21) {
    // 21h em diante: Sono reparador e desaceleração
    return dispatchSleepReminders();
  } else if (brazilHour >= 17 && brazilHour <= 20) {
    // 17h às 20h: Lembrete de treino pendente + hidratação
    const [evening, water] = await Promise.all([
      dispatchEveningWorkoutReminders(),
      dispatchWaterReminders(),
    ]);
    return {
      eveningDispatched: evening.dispatchedCount,
      waterDispatched: water.dispatchedCount,
    };
  } else if (brazilHour >= 11 && brazilHour <= 14) {
    // 11h às 14h: Nutrição / Almoço proteico + hidratação
    const [nutr, wat] = await Promise.all([
      dispatchNutritionReminders(),
      dispatchWaterReminders(),
    ]);
    return {
      nutritionDispatched: nutr.dispatchedCount,
      waterDispatched: wat.dispatchedCount,
    };
  } else {
    // Manhã / Tarde: Hidratação
    return dispatchWaterReminders();
  }
}
