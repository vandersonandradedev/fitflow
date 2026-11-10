import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  FileCheck2,
  FileEdit,
  GitBranchPlus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
  getProgramForTenant,
  listWorkoutTemplatesForTenant,
} from "@/modules/workouts/service";
import {
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT,
  SECTION_TYPE_LABELS,
  type DayOfWeekInput,
  type SectionTypeInput,
} from "@/modules/workouts/types";
import { requireCoachContext } from "@/server/auth/session";
import { NotFoundError } from "@/server/errors";
import {
  applyTemplateAction,
  createDraftVersionAction,
  deleteTrainingDayAction,
  moveTrainingDayAction,
  moveWorkoutExerciseAction,
  removeWorkoutExerciseAction,
  updateTrainingDayAction,
  updateWorkoutExerciseAction,
} from "../actions";
import {
  AddExerciseToDayForm,
  AddTrainingDayForm,
  PublishVersionForm,
  SaveTemplateForm,
} from "./builder-forms";

const WEEK_ORDER: DayOfWeekInput[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
  "ANY",
];

export default async function CoachWorkoutBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ versionId?: string }>;
}) {
  const ctx = await requireCoachContext();
  const { id } = await params;
  const query = await searchParams;

  let program;
  try {
    program = await getProgramForTenant(ctx, id);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  const [exercises, templates] = await Promise.all([
    listExercisesForTenant(ctx, { scope: "ALL", take: 200 }),
    listWorkoutTemplatesForTenant(ctx),
  ]);

  const draftVersion = program.versions.find((v) => v.status === "DRAFT");
  const publishedVersion = program.versions.find((v) => v.status === "PUBLISHED");

  const activeVersion =
    (query.versionId
      ? program.versions.find((v) => v.id === query.versionId)
      : undefined) ??
    draftVersion ??
    publishedVersion ??
    program.versions[0];

  if (!activeVersion) {
    notFound();
  }

  const isDraft = activeVersion.status === "DRAFT";

  const exerciseOptions = exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    categoryName: ex.category.name,
    primaryMuscleGroup: ex.primaryMuscleGroup,
    equipment: ex.equipment,
    isGlobal: ex.isGlobal,
  }));

  const daySelectOptions = activeVersion.trainingDays.map((d) => ({
    id: d.id,
    name: d.name,
    dayOfWeekLabel: DAY_OF_WEEK_LABELS[d.dayOfWeek] ?? d.dayOfWeek,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/coach/workouts"
        backLabel="Voltar para programas"
        title={program.title}
        meta={
          <>
            {activeVersion.status === "DRAFT" && (
              <Badge variant="warning" className="gap-1">
                <FileEdit className="h-3.5 w-3.5" />
                Rascunho v{activeVersion.versionNumber}
              </Badge>
            )}
            {activeVersion.status === "PUBLISHED" && (
              <Badge variant="emerald" className="gap-1">
                <FileCheck2 className="h-3.5 w-3.5" />
                Publicada v{activeVersion.versionNumber}
              </Badge>
            )}
            {activeVersion.status === "ARCHIVED" && (
              <Badge variant="secondary">Arquivada v{activeVersion.versionNumber}</Badge>
            )}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {program.versions.map((v) => {
              const selected = v.id === activeVersion.id;
              return (
                <Link
                  key={v.id}
                  href={`/coach/workouts/${program.id}?versionId=${v.id}`}
                  className={`rounded-md border px-2.5 py-1.5 font-mono text-xs font-medium transition-colors ${
                    selected
                      ? "border-primary/40 bg-secondary text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  v{v.versionNumber} ({v.status})
                </Link>
              );
            })}

            {!draftVersion && (
              <form action={createDraftVersionAction}>
                <input type="hidden" name="programId" value={program.id} />
                <Button type="submit" size="sm">
                  <GitBranchPlus className="h-4 w-4" />
                  Nova versão v{(program.versions[0]?.versionNumber ?? 1) + 1}
                </Button>
              </form>
            )}
          </div>
        }
      />

      {/* Student Metadata Line */}
      <p className="-mt-3 text-xs text-muted-foreground">
        Aluno:{" "}
        <Link
          href={`/coach/students/${program.studentProfileId}`}
          className="font-medium text-primary hover:underline"
        >
          {program.studentProfile.user.name ?? program.studentProfile.user.email}
        </Link>
        {program.goal ? ` · Objetivo: ${program.goal}` : ""}
      </p>

      {/* Version Status / Publish Strip */}
      {isDraft ? (
        <section className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Publicar versão v{activeVersion.versionNumber} para o aluno
            </p>
            <p className="text-xs text-muted-foreground">
              A versão publicada anteriormente será arquivada preservando todo o histórico de execução.
            </p>
          </div>
          <div className="w-full lg:w-[420px]">
            <PublishVersionForm
              programId={program.id}
              versionId={activeVersion.id}
              versionNumber={activeVersion.versionNumber}
            />
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Versão <strong className="text-foreground">v{activeVersion.versionNumber}</strong> em modo somente leitura para preservar registros já executados.
          </span>
          {draftVersion && (
            <Link
              href={`/coach/workouts/${program.id}?versionId=${draftVersion.id}`}
              className="shrink-0 font-medium text-primary hover:underline"
            >
              Abrir rascunho v{draftVersion.versionNumber}
            </Link>
          )}
        </div>
      )}

      {/* Weekly Calendar Strip (Compact hairline table-strip, no nested cards) */}
      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-foreground">
          Distribuição semanal — v{activeVersion.versionNumber}
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 lg:grid-cols-8 lg:divide-y-0">
          {WEEK_ORDER.map((dow) => {
            const assignedDays = activeVersion.trainingDays.filter(
              (d) => d.dayOfWeek === dow
            );
            return (
              <div
                key={dow}
                className={`p-3 ${assignedDays.length > 0 ? "bg-emerald-500/[0.04]" : ""}`}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {DAY_OF_WEEK_SHORT[dow]}
                </p>
                {assignedDays.length === 0 ? (
                  <p className="mt-1.5 text-[11px] text-brand-textMuted">Descanso</p>
                ) : (
                  <div className="mt-1.5 space-y-1">
                    {assignedDays.map((d) => (
                      <div key={d.id} className="text-xs">
                        <p className="truncate font-medium text-primary">{d.name}</p>
                        <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {d.workoutExercises.length} exerc.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 2-Column Builder */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Control Panel */}
        {isDraft && (
          <aside className="xl:col-span-4 rounded-lg border border-border bg-card divide-y divide-border self-start">
            <div className="p-4 space-y-3">
              <h2 className="text-xs font-semibold text-foreground">
                Adicionar dia de treino
              </h2>
              <AddTrainingDayForm
                programId={program.id}
                versionId={activeVersion.id}
              />
            </div>

            <div className="p-4 space-y-3">
              <h2 className="text-xs font-semibold text-foreground">
                Prescrever exercício
              </h2>
              <AddExerciseToDayForm
                programId={program.id}
                days={daySelectOptions}
                exercises={exerciseOptions}
              />
            </div>

            {templates.length > 0 && (
              <div className="p-4 space-y-3">
                <h2 className="text-xs font-semibold text-foreground">
                  Importar template do estúdio
                </h2>
                <form action={applyTemplateAction} className="space-y-2.5">
                  <input type="hidden" name="programId" value={program.id} />
                  <input type="hidden" name="versionId" value={activeVersion.id} />
                  <Select
                    name="templateId"
                    required
                    defaultValue={templates[0]?.id ?? ""}
                    className="text-xs"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} {t.category ? `(${t.category})` : ""}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="outline" size="sm" className="w-full">
                    Importar dias do template
                  </Button>
                </form>
              </div>
            )}
          </aside>
        )}

        {/* Right Canvas */}
        <div className={`space-y-6 ${isDraft ? "xl:col-span-8" : "xl:col-span-12"}`}>
          {activeVersion.trainingDays.length === 0 ? (
            <EmptyState
              title="Nenhum dia de treino configurado nesta versão"
              description="Adicione o primeiro dia no painel ao lado ou importe um template salvo."
            />
          ) : (
            activeVersion.trainingDays.map((day, dayIndex) => (
              <section
                key={day.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* Day Header */}
                <div className="border-b border-border bg-popover/50 p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="emerald" className="font-mono">
                          Dia {dayIndex + 1}
                        </Badge>
                        <h3 className="text-base font-semibold text-foreground">
                          {day.name}
                        </h3>
                        <Badge variant="outline">
                          {DAY_OF_WEEK_LABELS[day.dayOfWeek] ?? day.dayOfWeek}
                        </Badge>
                      </div>
                      {day.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{day.description}</p>
                      )}
                    </div>

                    {isDraft && (
                      <div className="flex items-center gap-1">
                        <form action={moveTrainingDayAction}>
                          <input type="hidden" name="programId" value={program.id} />
                          <input type="hidden" name="versionId" value={activeVersion.id} />
                          <input type="hidden" name="trainingDayId" value={day.id} />
                          <input type="hidden" name="direction" value="up" />
                          <Button
                            type="submit"
                            variant="outline"
                            size="icon"
                            disabled={dayIndex === 0}
                            className="h-8 w-8"
                            title="Subir dia"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                        </form>

                        <form action={moveTrainingDayAction}>
                          <input type="hidden" name="programId" value={program.id} />
                          <input type="hidden" name="versionId" value={activeVersion.id} />
                          <input type="hidden" name="trainingDayId" value={day.id} />
                          <input type="hidden" name="direction" value="down" />
                          <Button
                            type="submit"
                            variant="outline"
                            size="icon"
                            disabled={dayIndex === activeVersion.trainingDays.length - 1}
                            className="h-8 w-8"
                            title="Descer dia"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </form>

                        <form action={deleteTrainingDayAction}>
                          <input type="hidden" name="programId" value={program.id} />
                          <input type="hidden" name="trainingDayId" value={day.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            title="Excluir dia"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>

                  {isDraft && (
                    <form
                      action={updateTrainingDayAction}
                      className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3"
                    >
                      <input type="hidden" name="programId" value={program.id} />
                      <input type="hidden" name="trainingDayId" value={day.id} />
                      <Input
                        name="name"
                        defaultValue={day.name}
                        required
                        className="h-8 w-44 text-xs"
                      />
                      <Select
                        name="dayOfWeek"
                        defaultValue={day.dayOfWeek}
                        className="h-8 w-36 text-xs"
                      >
                        {Object.entries(DAY_OF_WEEK_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <Input
                        name="description"
                        defaultValue={day.description ?? ""}
                        placeholder="Descrição opcional..."
                        className="h-8 flex-1 min-w-[160px] text-xs"
                      />
                      <Button type="submit" variant="outline" size="sm" className="h-8">
                        Atualizar dia
                      </Button>
                    </form>
                  )}
                </div>

                {/* Exercises List (Hairline dividers, no card-in-card nesting) */}
                {day.workoutExercises.length === 0 ? (
                  <p className="p-6 text-center text-xs text-muted-foreground">
                    Nenhum exercício prescrito neste dia ainda.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {day.workoutExercises.map((wex, exIndex) => {
                      const firstSet = wex.sets[0];
                      return (
                        <div key={wex.id} className="p-4 sm:p-5 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-primary">
                                  {String(exIndex + 1).padStart(2, "0")}
                                </span>
                                <Link
                                  href={`/coach/exercises/${wex.exerciseId}`}
                                  className="text-sm font-semibold text-foreground hover:text-primary"
                                >
                                  {wex.exercise.name}
                                </Link>
                                <Badge variant="outline">
                                  {SECTION_TYPE_LABELS[
                                    wex.sectionType as SectionTypeInput
                                  ] ?? wex.sectionType}
                                </Badge>
                                {wex.supersetGroupId && (
                                  <Badge variant="emerald">
                                    Super-série {wex.supersetGroupId}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {wex.exercise.category.name} · {wex.exercise.primaryMuscleGroup}
                              </p>
                            </div>

                            {isDraft && (
                              <div className="flex items-center gap-1">
                                <form action={moveWorkoutExerciseAction}>
                                  <input type="hidden" name="programId" value={program.id} />
                                  <input type="hidden" name="trainingDayId" value={day.id} />
                                  <input type="hidden" name="workoutExerciseId" value={wex.id} />
                                  <input type="hidden" name="direction" value="up" />
                                  <Button
                                    type="submit"
                                    variant="outline"
                                    size="icon"
                                    disabled={exIndex === 0}
                                    className="h-7 w-7"
                                    title="Subir exercício"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                </form>

                                <form action={moveWorkoutExerciseAction}>
                                  <input type="hidden" name="programId" value={program.id} />
                                  <input type="hidden" name="trainingDayId" value={day.id} />
                                  <input type="hidden" name="workoutExerciseId" value={wex.id} />
                                  <input type="hidden" name="direction" value="down" />
                                  <Button
                                    type="submit"
                                    variant="outline"
                                    size="icon"
                                    disabled={exIndex === day.workoutExercises.length - 1}
                                    className="h-7 w-7"
                                    title="Descer exercício"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </form>

                                <form action={removeWorkoutExerciseAction}>
                                  <input type="hidden" name="programId" value={program.id} />
                                  <input type="hidden" name="workoutExerciseId" value={wex.id} />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    title="Remover exercício"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </form>
                              </div>
                            )}
                          </div>

                          {/* Sets Table */}
                          <div className="rounded-md border border-border overflow-hidden">
                            <Table className="text-xs">
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="h-8">Série</TableHead>
                                  <TableHead className="h-8">Reps alvo</TableHead>
                                  <TableHead className="h-8">Carga sugerida</TableHead>
                                  <TableHead className="h-8">Descanso</TableHead>
                                  <TableHead className="h-8">Cadência</TableHead>
                                  <TableHead className="h-8">RPE</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {wex.sets.map((s) => (
                                  <TableRow key={s.id}>
                                    <TableCell className="py-1.5 font-mono font-semibold text-primary tabular-nums">
                                      #{s.setNumber}
                                    </TableCell>
                                    <TableCell className="py-1.5 font-mono tabular-nums">
                                      {s.repsTarget}
                                    </TableCell>
                                    <TableCell className="py-1.5 font-mono tabular-nums">
                                      {s.suggestedLoadKg !== null
                                        ? `${Number(s.suggestedLoadKg)} kg`
                                        : "—"}
                                    </TableCell>
                                    <TableCell className="py-1.5 font-mono tabular-nums">
                                      {s.restSeconds}s
                                    </TableCell>
                                    <TableCell className="py-1.5 font-mono tabular-nums">
                                      {s.tempo ?? "—"}
                                    </TableCell>
                                    <TableCell className="py-1.5 font-mono tabular-nums">
                                      {s.targetRpe !== null ? Number(s.targetRpe) : "—"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {wex.coachNotes && (
                            <p className="border-l-2 border-primary/50 pl-3 text-xs text-muted-foreground">
                              <strong className="text-foreground">Nota técnica:</strong>{" "}
                              {wex.coachNotes}
                            </p>
                          )}

                          {/* Inline Prescription Editor */}
                          {isDraft && (
                            <form
                              action={updateWorkoutExerciseAction}
                              className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-7"
                            >
                              <input type="hidden" name="programId" value={program.id} />
                              <input type="hidden" name="workoutExerciseId" value={wex.id} />
                              <input type="hidden" name="sectionType" value={wex.sectionType} />

                              <div>
                                <span className="mb-1 block text-[11px] text-muted-foreground">
                                  Séries
                                </span>
                                <Input
                                  name="setsCount"
                                  type="number"
                                  min={1}
                                  max={15}
                                  defaultValue={wex.sets.length}
                                  className="h-8 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <span className="mb-1 block text-[11px] text-muted-foreground">
                                  Reps
                                </span>
                                <Input
                                  name="repsTarget"
                                  defaultValue={firstSet?.repsTarget ?? "10-12"}
                                  className="h-8 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <span className="mb-1 block text-[11px] text-muted-foreground">
                                  Carga (kg)
                                </span>
                                <Input
                                  name="suggestedLoadKg"
                                  type="number"
                                  step="0.5"
                                  defaultValue={
                                    firstSet?.suggestedLoadKg !== null &&
                                    firstSet?.suggestedLoadKg !== undefined
                                      ? Number(firstSet.suggestedLoadKg)
                                      : ""
                                  }
                                  className="h-8 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <span className="mb-1 block text-[11px] text-muted-foreground">
                                  Descanso (s)
                                </span>
                                <Input
                                  name="restSeconds"
                                  type="number"
                                  defaultValue={firstSet?.restSeconds ?? 60}
                                  className="h-8 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <span className="mb-1 block text-[11px] text-muted-foreground">
                                  Super-série
                                </span>
                                <Input
                                  name="supersetGroupId"
                                  defaultValue={wex.supersetGroupId ?? ""}
                                  placeholder="A1"
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div>
                                <span className="mb-1 block text-[11px] text-muted-foreground">
                                  Notas
                                </span>
                                <Input
                                  name="coachNotes"
                                  defaultValue={wex.coachNotes ?? ""}
                                  placeholder="Nota técnica..."
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="flex items-end col-span-2 sm:col-span-1">
                                <Button
                                  type="submit"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-full"
                                >
                                  Salvar
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))
          )}

          {/* Save Current Version as Template */}
          {activeVersion.trainingDays.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold text-foreground">
                Salvar versão v{activeVersion.versionNumber} como template reutilizável
              </h3>
              <SaveTemplateForm
                programId={program.id}
                versionId={activeVersion.id}
                defaultTitle={program.title}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
