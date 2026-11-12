import { notFound, redirect } from "next/navigation";
import {
  getLastPerformanceForExercises,
  getSessionDetails,
} from "@/modules/sessions/service";
import { requireStudentContext } from "@/server/auth/session";
import { NotFoundError } from "@/server/errors";
import { WorkoutRunner } from "./workout-runner";

export default async function StudentSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const ctx = await requireStudentContext();
  const { sessionId } = await params;

  const session = await getSessionDetails(ctx, sessionId).catch((err) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });

  // Se a sessão já estiver concluída, redireciona para o histórico
  if (session.status === "COMPLETED") {
    redirect("/student/history");
  }

  const exerciseIds = session.exerciseLogs.map((log) => log.exerciseId);
  const lastPerformanceMap = await getLastPerformanceForExercises(
    ctx,
    exerciseIds
  );

  const runnerExercises = session.exerciseLogs.map((log) => ({
    id: log.id,
    exerciseId: log.exerciseId,
    workoutExerciseId: log.workoutExerciseId,
    name: log.exercise.name,
    primaryMuscleGroup: log.exercise.primaryMuscleGroup,
    categoryName: log.exercise.category.name,
    mediaUrl: log.exercise.media[0]?.url ?? null,
    coachNotes: log.notes,
    instructions: log.exercise.instructions.map((inst) => ({
      stepNumber: inst.stepNumber,
      instruction: inst.instruction,
      safetyTip: inst.safetyTip,
    })),
    sets: log.setLogs.map((s) => ({
      id: s.id,
      setNumber: s.setNumber,
      prescribedLoadKg:
        s.prescribedLoadKg !== null ? Number(s.prescribedLoadKg) : undefined,
      actualLoadKg: Number(s.actualLoadKg),
      prescribedReps: s.prescribedReps,
      actualReps: s.actualReps,
      completed: s.completed,
      restTakenSeconds: s.restTakenSeconds,
      rpe: s.rpe !== null ? Number(s.rpe) : undefined,
    })),
  }));

  return (
    <WorkoutRunner
      sessionId={session.id}
      dayName={session.trainingDay.name}
      dayDescription={session.trainingDay.description}
      startedAtIso={session.startedAt.toISOString()}
      initialExercises={runnerExercises}
      lastPerformanceMap={lastPerformanceMap}
      studentName={ctx.userName ?? "Aluno"}
    />
  );
}
