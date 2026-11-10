import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { RecordAssessmentDialog } from "./assessment-form";
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
        <PageHeader
          title="Evolução e Acompanhamento"
          description="Sobrecarga progressiva, volume semanal, adesão e composição corporal dos seus alunos."
        />
        <EmptyState
          title="Nenhum aluno ativo cadastrado"
          description="Convide alunos na aba Alunos para acompanhar o progresso de cargas, medidas e adesão."
        />
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

  const studentDisplayName =
    selectedStudent.user.name ?? selectedStudent.user.email;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evolução e Acompanhamento"
        description="Sobrecarga progressiva, volume muscular, adesão semanal e avaliações físicas."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <form method="GET" className="flex items-center gap-2">
              {params.exerciseId && (
                <input type="hidden" name="exerciseId" value={params.exerciseId} />
              )}
              <Select
                id="studentProfileId"
                name="studentProfileId"
                defaultValue={selectedStudent.id}
                aria-label="Selecionar aluno"
                className="w-48 text-xs font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name ?? s.user.email}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="outline" size="sm" className="h-9">
                Carregar
              </Button>
            </form>

            <RecordAssessmentDialog
              studentProfileId={selectedStudent.id}
              studentName={studentDisplayName}
            />
          </div>
        }
      />

      {/* Unified KPI Metrics Strip */}
      <section className="grid grid-cols-2 divide-y divide-border rounded-lg border border-border bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Adesão média</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {avgAdherence}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Últimas 8 semanas</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Volume mensal</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {totalTonnage4Weeks.toLocaleString("pt-BR")}{" "}
            <span className="text-sm font-normal text-muted-foreground">kg</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Últimas 4 semanas</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Peso atual</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {latestAssessment ? Number(latestAssessment.weightKg) : "—"}{" "}
            <span className="text-sm font-normal text-muted-foreground">kg</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {latestAssessment
              ? new Date(latestAssessment.assessmentDate).toLocaleDateString("pt-BR")
              : "Sem avaliação"}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted-foreground">Gordura corporal</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {latestAssessment?.bodyFatPercentage
              ? `${Number(latestAssessment.bodyFatPercentage)}%`
              : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {latestAssessment?.muscleMassPercentage
              ? `Massa muscular: ${Number(latestAssessment.muscleMassPercentage)}%`
              : "Composição corporal"}
          </p>
        </div>
      </section>

      {/* Row 1: Adherence + Muscle Volume */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Consistência e adesão semanal
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Treinos realizados versus meta semanal do programa ativo.
            </p>
          </div>
          <AdherenceChart data={adherenceData} />
        </section>

        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Volume acumulado por grupo muscular
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tonelagem total levantada (kg) nos últimos 30 dias.
            </p>
          </div>
          <MuscleVolumeChart data={muscleVolumeData} />
        </section>
      </div>

      {/* Row 2: Progressive Overload & 1RM */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Sobrecarga progressiva e 1RM estimada
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Evolução de carga máxima e 1RM estimada (Epley) por sessão.
            </p>
          </div>

          <form method="GET" className="flex items-center gap-2">
            <input type="hidden" name="studentProfileId" value={selectedStudent.id} />
            <Select
              name="exerciseId"
              defaultValue={selectedExercise?.id ?? ""}
              aria-label="Selecionar exercício"
              className="h-8 w-56 text-xs"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.category.name}] {ex.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="outline" size="sm" className="h-8">
              Filtrar
            </Button>
          </form>
        </div>
        <ExerciseProgressionChart data={exerciseStats.points} />
      </section>

      {/* Row 3: Body Composition Chart */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Composição corporal ao longo do tempo
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Evolução do peso corporal (kg) e percentual de gordura (%).
            </p>
          </div>
        </div>
        <BodyCompositionChart data={bodyCompositionData} />
      </section>

      {/* Physical Assessments History Table */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">
            Histórico de avaliações físicas ({assessments.length})
          </h2>
        </div>

        {assessments.length === 0 ? (
          <p className="px-5 py-6 text-xs text-muted-foreground">
            Nenhuma avaliação física cadastrada para este aluno.
          </p>
        ) : (
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Data</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Gordura</TableHead>
                <TableHead>Massa musc.</TableHead>
                <TableHead>Cintura</TableHead>
                <TableHead>Abdômen</TableHead>
                <TableHead>Braço D/E</TableHead>
                <TableHead>Coxa D/E</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((a) => {
                const m = a.measurements[0];
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono tabular-nums font-medium">
                      {new Date(a.assessmentDate).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums font-semibold text-primary">
                      {Number(a.weightKg)} kg
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {a.bodyFatPercentage ? `${Number(a.bodyFatPercentage)}%` : "—"}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {a.muscleMassPercentage ? `${Number(a.muscleMassPercentage)}%` : "—"}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {m?.waistCm ? `${Number(m.waistCm)} cm` : "—"}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {m?.abdomenCm ? `${Number(m.abdomenCm)} cm` : "—"}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {m?.rightArmCm ? `${Number(m.rightArmCm)}` : "—"} /{" "}
                      {m?.leftArmCm ? `${Number(m.leftArmCm)} cm` : "—"}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {m?.rightThighCm ? `${Number(m.rightThighCm)}` : "—"} /{" "}
                      {m?.leftThighCm ? `${Number(m.leftThighCm)} cm` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
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
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          title="Excluir avaliação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
