import {
  Activity,
  Calendar,
  Dumbbell,
  Flame,
  LineChart,
  PlusCircle,
  Scale,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listExercisesForTenant } from "@/modules/exercises/service";
import {
  getBodyCompositionProgression,
  getExerciseProgressionStats,
  getMuscleGroupVolumeStats,
  getWeeklyAdherenceStats,
  listPhysicalAssessments,
} from "@/modules/progress/service";
import { listStudentsForTenant } from "@/modules/students/service";
import { requireCoachContext } from "@/server/auth/session";
import { deleteAssessmentAction } from "./actions";
import { AssessmentForm } from "./assessment-form";
import {
  AdherenceChart,
  BodyCompositionChart,
  ExerciseProgressionChart,
  MuscleVolumeChart,
} from "./charts";

export default async function CoachProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ studentProfileId?: string; exerciseId?: string }>;
}) {
  const ctx = await requireCoachContext();
  const params = await searchParams;

  const [students, exercises] = await Promise.all([
    listStudentsForTenant(ctx, { status: "ACTIVE" }),
    listExercisesForTenant(ctx, { scope: "ALL", take: 100 }),
  ]);

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">
            Evolução & Acompanhamento
          </h1>
          <p className="text-sm text-[#9BA3AF]">
            Inteligência de dados, sobrecarga progressiva, volume e composição corporal dos seus alunos.
          </p>
        </div>
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardContent className="p-8 text-center space-y-2">
            <LineChart className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="text-base font-semibold text-[#F3F5F7]">
              Nenhum aluno ativo cadastrado
            </h2>
            <p className="text-xs text-[#9BA3AF]">
              Convide alunos na aba <strong>Alunos</strong> para acompanhar o progresso de cargas, medidas e adesão.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedStudent =
    students.find((s) => s.id === params.studentProfileId) ?? students[0]!;

  const selectedExercise =
    exercises.find((e) => e.id === params.exerciseId) ?? exercises[0]!;

  const [adherenceData, exerciseStats, muscleVolumeData, bodyCompositionData, assessments] =
    await Promise.all([
      getWeeklyAdherenceStats(ctx, selectedStudent.id, 8),
      selectedExercise
        ? getExerciseProgressionStats(ctx, selectedExercise.id, selectedStudent.id)
        : Promise.resolve({ exercise: null, points: [] }),
      getMuscleGroupVolumeStats(ctx, selectedStudent.id, 4),
      getBodyCompositionProgression(ctx, selectedStudent.id),
      listPhysicalAssessments(ctx, selectedStudent.id),
    ]);

  const latestAssessment = assessments[0];
  const avgAdherence =
    adherenceData.length > 0
      ? Math.round(
          adherenceData.reduce((acc, w) => acc + w.adherencePercentage, 0) /
            adherenceData.length
        )
      : 0;

  const totalTonnage4Weeks = muscleVolumeData.reduce(
    (acc, m) => acc + m.totalVolumeKg,
    0
  );

  return (
    <div className="space-y-8">
      {/* Top Bar with Student Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#242C3A] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">
            Evolução & Acompanhamento
          </h1>
          <p className="text-sm text-[#9BA3AF]">
            Inteligência de dados, sobrecarga progressiva, volume muscular e histórico de avaliações.
          </p>
        </div>

        <form method="GET" className="flex items-center gap-2">
          {params.exerciseId && (
            <input type="hidden" name="exerciseId" value={params.exerciseId} />
          )}
          <label htmlFor="studentProfileId" className="text-xs text-[#9BA3AF] shrink-0 font-medium">
            Aluno Selecionado:
          </label>
          <select
            id="studentProfileId"
            name="studentProfileId"
            defaultValue={selectedStudent.id}
            className="h-9 rounded-md border border-[#242C3A] bg-[#12161D] px-2.5 text-xs text-[#F3F5F7] font-semibold"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user.name ?? s.user.email}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm" className="h-9 border-[#242C3A] text-xs">
            Ver Aluno
          </Button>
        </form>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#647082] flex items-center justify-between">
              Adesão Média
              <Activity className="h-4 w-4 text-emerald-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-[#F3F5F7]">{avgAdherence}%</p>
            <p className="text-[11px] text-[#9BA3AF] mt-0.5">Últimas 8 semanas</p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#647082] flex items-center justify-between">
              Volume Mensal
              <Flame className="h-4 w-4 text-amber-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-[#F3F5F7]">
              {totalTonnage4Weeks.toLocaleString("pt-BR")}{" "}
              <span className="text-sm font-normal text-[#9BA3AF]">kg</span>
            </p>
            <p className="text-[11px] text-[#9BA3AF] mt-0.5">Últimas 4 semanas</p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#647082] flex items-center justify-between">
              Peso Atual
              <Scale className="h-4 w-4 text-emerald-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-[#F3F5F7]">
              {latestAssessment ? Number(latestAssessment.weightKg) : "—"}{" "}
              <span className="text-sm font-normal text-[#9BA3AF]">kg</span>
            </p>
            <p className="text-[11px] text-[#9BA3AF] mt-0.5">
              {latestAssessment
                ? new Date(latestAssessment.assessmentDate).toLocaleDateString("pt-BR")
                : "Sem avaliação"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="p-4 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#647082] flex items-center justify-between">
              Gordura Corporal
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-[#F3F5F7]">
              {latestAssessment?.bodyFatPercentage
                ? `${Number(latestAssessment.bodyFatPercentage)}%`
                : "—"}
            </p>
            <p className="text-[11px] text-[#9BA3AF] mt-0.5">
              {latestAssessment?.muscleMassPercentage
                ? `Massa Muscular: ${Number(latestAssessment.muscleMassPercentage)}%`
                : "Composição corporal"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Adherence Chart + Muscle Volume Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Consistência & Adesão Semanal
            </CardTitle>
            <p className="text-xs text-[#9BA3AF]">
              Treinos realizados vs. meta semanal prescrita pelo programa ativo.
            </p>
          </CardHeader>
          <CardContent>
            <AdherenceChart data={adherenceData} />
          </CardContent>
        </Card>

        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              Volume Acumulado por Grupo Muscular
            </CardTitle>
            <p className="text-xs text-[#9BA3AF]">
              Tonelagem total levantada (kg) agrupada nos últimos 30 dias.
            </p>
          </CardHeader>
          <CardContent>
            <MuscleVolumeChart data={muscleVolumeData} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Progressive Overload & 1RM Progression by Exercise */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              Sobrecarga Progressiva & 1RM Estimada
            </CardTitle>
            <p className="text-xs text-[#9BA3AF]">
              Evolução da carga máxima e 1RM estimada (Fórmula de Epley) por sessão realizada.
            </p>
          </div>

          <form method="GET" className="flex items-center gap-2">
            <input
              type="hidden"
              name="studentProfileId"
              value={selectedStudent.id}
            />
            <select
              name="exerciseId"
              defaultValue={selectedExercise?.id ?? ""}
              className="h-8 rounded-md border border-[#242C3A] bg-[#090B0E] px-2 text-xs text-[#F3F5F7]"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.category.name}] {ex.name}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-8 border-[#242C3A] text-xs"
            >
              Filtrar
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <ExerciseProgressionChart data={exerciseStats.points} />
        </CardContent>
      </Card>

      {/* Row 3: Body Composition Progression & Assessment Registration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Composition Chart (7 cols on LG) */}
        <div className="lg:col-span-7">
          <Card className="border-[#242C3A] bg-[#12161D] h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-400" />
                Composição Corporal ao Longo do Tempo
              </CardTitle>
              <p className="text-xs text-[#9BA3AF]">
                Evolução do peso corporal (kg) e percentual de gordura (%).
              </p>
            </CardHeader>
            <CardContent>
              <BodyCompositionChart data={bodyCompositionData} />
            </CardContent>
          </Card>
        </div>

        {/* Register Assessment Form (5 cols on LG) */}
        <div className="lg:col-span-5">
          <Card className="border-[#242C3A] bg-[#12161D]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                Registrar Avaliação Física
              </CardTitle>
              <p className="text-xs text-[#9BA3AF]">
                Para {selectedStudent.user.name ?? selectedStudent.user.email}
              </p>
            </CardHeader>
            <CardContent>
              <AssessmentForm studentProfileId={selectedStudent.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Physical Assessments History Table */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7]">
            Histórico de Avaliações Físicas ({assessments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-xs text-[#9BA3AF]">
              Nenhuma avaliação física cadastrada para este aluno.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161B24] text-[11px] uppercase text-[#9BA3AF]">
                  <tr>
                    <th className="px-3 py-2.5">Data</th>
                    <th className="px-3 py-2.5">Peso</th>
                    <th className="px-3 py-2.5">Gordura (%)</th>
                    <th className="px-3 py-2.5">Massa Musc. (%)</th>
                    <th className="px-3 py-2.5">Cintura</th>
                    <th className="px-3 py-2.5">Abdômen</th>
                    <th className="px-3 py-2.5">Braço D/E</th>
                    <th className="px-3 py-2.5">Coxa D/E</th>
                    <th className="px-3 py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242C3A]/60">
                  {assessments.map((a) => {
                    const m = a.measurements[0];
                    return (
                      <tr key={a.id} className="text-[#F3F5F7]">
                        <td className="px-3 py-2 font-medium">
                          {new Date(a.assessmentDate).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 font-bold text-emerald-400">
                          {Number(a.weightKg)} kg
                        </td>
                        <td className="px-3 py-2">
                          {a.bodyFatPercentage ? `${Number(a.bodyFatPercentage)}%` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {a.muscleMassPercentage
                            ? `${Number(a.muscleMassPercentage)}%`
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {m?.waistCm ? `${Number(m.waistCm)} cm` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {m?.abdomenCm ? `${Number(m.abdomenCm)} cm` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {m?.rightArmCm ? `${Number(m.rightArmCm)}` : "—"} /{" "}
                          {m?.leftArmCm ? `${Number(m.leftArmCm)} cm` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {m?.rightThighCm ? `${Number(m.rightThighCm)}` : "—"} /{" "}
                          {m?.leftThighCm ? `${Number(m.leftThighCm)} cm` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <form action={deleteAssessmentAction}>
                            <input type="hidden" name="assessmentId" value={a.id} />
                            <input
                              type="hidden"
                              name="studentProfileId"
                              value={selectedStudent.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Excluir avaliação"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
