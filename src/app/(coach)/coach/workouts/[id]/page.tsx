import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  Copy,
  Dumbbell,
  FileCheck2,
  FileEdit,
  GitBranchPlus,
  Layers,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-8">
      {/* Top Header & Version Control Bar */}
      <div className="flex flex-col gap-4 border-b border-[#242C3A] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/coach/workouts"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-[#9BA3AF] hover:text-[#F3F5F7]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Programas de Treinamento
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">
              {program.title}
            </h1>
            {activeVersion.status === "DRAFT" && (
              <Badge variant="warning" className="gap-1">
                <FileEdit className="h-3.5 w-3.5" />
                Rascunho Editável (v{activeVersion.versionNumber})
              </Badge>
            )}
            {activeVersion.status === "PUBLISHED" && (
              <Badge variant="emerald" className="gap-1">
                <FileCheck2 className="h-3.5 w-3.5" />
                Versão Publicada (v{activeVersion.versionNumber})
              </Badge>
            )}
            {activeVersion.status === "ARCHIVED" && (
              <Badge variant="secondary">
                Versão Arquivada (v{activeVersion.versionNumber})
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-[#9BA3AF]">
            Aluno:{" "}
            <Link
              href={`/coach/students/${program.studentProfileId}`}
              className="font-semibold text-emerald-400 hover:underline"
            >
              {program.studentProfile.user.name ??
                program.studentProfile.user.email}
            </Link>
            {program.goal ? ` • Objetivo: ${program.goal}` : ""}
          </p>
        </div>

        {/* Version Switcher & Evolution Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {program.versions.map((v) => {
            const selected = v.id === activeVersion.id;
            return (
              <Link
                key={v.id}
                href={`/coach/workouts/${program.id}?versionId=${v.id}`}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                    : "border-[#242C3A] bg-[#12161D] text-[#9BA3AF] hover:text-[#F3F5F7]"
                }`}
              >
                v{v.versionNumber} ({v.status})
              </Link>
            );
          })}

          {!draftVersion && (
            <form action={createDraftVersionAction}>
              <input type="hidden" name="programId" value={program.id} />
              <Button type="submit" size="sm" className="gap-1.5">
                <GitBranchPlus className="h-4 w-4" />
                Nova Versão em Rascunho (v{(program.versions[0]?.versionNumber ?? 1) + 1})
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Publish Banner (When viewing a DRAFT version) */}
      {isDraft ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#F3F5F7]">
                Pronto para disponibilizar a v{activeVersion.versionNumber} ao aluno?
              </p>
              <p className="text-xs text-[#9BA3AF]">
                Ao publicar, a versão anterior será arquivada de forma imutável (preservando todo o histórico) e o aluno receberá esta programação imediatamente.
              </p>
            </div>
            <div className="w-full lg:w-[440px]">
              <PublishVersionForm
                programId={program.id}
                versionId={activeVersion.id}
                versionNumber={activeVersion.versionNumber}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#242C3A] bg-[#12161D]/80">
          <CardContent className="flex items-center justify-between gap-4 p-4 text-xs text-[#9BA3AF]">
            <span>
              Esta versão (<strong>v{activeVersion.versionNumber} — {activeVersion.status}</strong>) é somente leitura para garantir a integridade dos registros de execução do aluno.
            </span>
            {draftVersion && (
              <Link
                href={`/coach/workouts/${program.id}?versionId=${draftVersion.id}`}
                className="shrink-0 font-semibold text-emerald-400 hover:underline"
              >
                Ir para o Rascunho Aberto (v{draftVersion.versionNumber}) →
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule Strip (Calendário Semanal) */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#F3F5F7] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Distribuição Semanal da Versão v{activeVersion.versionNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {WEEK_ORDER.map((dow) => {
              const assignedDays = activeVersion.trainingDays.filter(
                (d) => d.dayOfWeek === dow
              );
              return (
                <div
                  key={dow}
                  className={`rounded-lg border p-2.5 ${
                    assignedDays.length > 0
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-[#242C3A]/60 bg-[#090B0E]/60"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#647082]">
                    {DAY_OF_WEEK_SHORT[dow]}
                  </p>
                  {assignedDays.length === 0 ? (
                    <p className="mt-1.5 text-[11px] text-[#647082]">Descanso</p>
                  ) : (
                    <div className="mt-1.5 space-y-1">
                      {assignedDays.map((d) => (
                        <div
                          key={d.id}
                          className="rounded bg-[#12161D] px-1.5 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/20"
                        >
                          {d.name}
                          <span className="block text-[10px] text-[#9BA3AF]">
                            {d.workoutExercises.length} exerc.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Workout Builder: Left Drawer (Controls & Catalog) + Right Canvas (Days & Sets) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column: Builder Controls & Library Drawer (4 cols on XL) */}
        {isDraft && (
          <div className="space-y-6 xl:col-span-4">
            {/* 1. Add Training Day */}
            <Card className="border-[#242C3A] bg-[#12161D]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#F3F5F7] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  Adicionar Dia de Treino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddTrainingDayForm
                  programId={program.id}
                  versionId={activeVersion.id}
                />
              </CardContent>
            </Card>

            {/* 2. Exercise Library Prescription Drawer */}
            <Card className="border-[#242C3A] bg-[#12161D]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#F3F5F7] flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-emerald-400" />
                  Gaveta de Prescrição de Exercícios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddExerciseToDayForm
                  programId={program.id}
                  days={daySelectOptions}
                  exercises={exerciseOptions}
                />
              </CardContent>
            </Card>

            {/* 3. Import from Saved Template */}
            {templates.length > 0 && (
              <Card className="border-[#242C3A] bg-[#12161D]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#F3F5F7] flex items-center gap-2">
                    <Copy className="h-4 w-4 text-emerald-400" />
                    Importar Template do Estúdio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={applyTemplateAction} className="space-y-2.5">
                    <input type="hidden" name="programId" value={program.id} />
                    <input
                      type="hidden"
                      name="versionId"
                      value={activeVersion.id}
                    />
                    <select
                      name="templateId"
                      required
                      defaultValue={templates[0]?.id ?? ""}
                      className="flex h-9 w-full rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 text-xs text-[#F3F5F7]"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} {t.category ? `(${t.category})` : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="w-full border-[#242C3A] text-xs"
                    >
                      Importar Dias do Template
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Right Column: Continuous Workout Canvas (8 cols on XL when Draft, 12 cols when Read-only) */}
        <div className={`space-y-6 ${isDraft ? "xl:col-span-8" : "xl:col-span-12"}`}>
          {activeVersion.trainingDays.length === 0 ? (
            <Card className="border-dashed border-[#242C3A] bg-[#12161D]/60">
              <CardContent className="p-10 text-center">
                <p className="text-sm font-semibold text-[#F3F5F7]">
                  Nenhum dia de treino configurado nesta versão
                </p>
                <p className="mt-1 text-xs text-[#9BA3AF]">
                  Utilize o painel ao lado para adicionar o primeiro dia (ex: Treino A — Segunda-feira) ou importe um template salvo.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeVersion.trainingDays.map((day, dayIndex) => (
              <Card
                key={day.id}
                className="border-[#242C3A] bg-[#12161D] overflow-hidden"
              >
                {/* Day Header */}
                <CardHeader className="border-b border-[#242C3A]/80 bg-[#090B0E]/40 pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="emerald" className="text-[11px]">
                          Dia {dayIndex + 1}
                        </Badge>
                        <h2 className="text-base font-bold text-[#F3F5F7]">
                          {day.name}
                        </h2>
                        <Badge variant="outline" className="text-[11px]">
                          {DAY_OF_WEEK_LABELS[day.dayOfWeek] ?? day.dayOfWeek}
                        </Badge>
                      </div>
                      {day.description && (
                        <p className="text-xs text-[#9BA3AF]">{day.description}</p>
                      )}
                    </div>

                    {isDraft && (
                      <div className="flex items-center gap-1.5">
                        <form action={moveTrainingDayAction}>
                          <input type="hidden" name="programId" value={program.id} />
                          <input
                            type="hidden"
                            name="versionId"
                            value={activeVersion.id}
                          />
                          <input
                            type="hidden"
                            name="trainingDayId"
                            value={day.id}
                          />
                          <input type="hidden" name="direction" value="up" />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            disabled={dayIndex === 0}
                            className="h-8 w-8 p-0 border-[#242C3A]"
                            title="Subir dia"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                        </form>

                        <form action={moveTrainingDayAction}>
                          <input type="hidden" name="programId" value={program.id} />
                          <input
                            type="hidden"
                            name="versionId"
                            value={activeVersion.id}
                          />
                          <input
                            type="hidden"
                            name="trainingDayId"
                            value={day.id}
                          />
                          <input type="hidden" name="direction" value="down" />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            disabled={
                              dayIndex === activeVersion.trainingDays.length - 1
                            }
                            className="h-8 w-8 p-0 border-[#242C3A]"
                            title="Descer dia"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </form>

                        <form action={deleteTrainingDayAction}>
                          <input type="hidden" name="programId" value={program.id} />
                          <input
                            type="hidden"
                            name="trainingDayId"
                            value={day.id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            title="Excluir dia"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Quick Edit Day Metadata (When Draft) */}
                  {isDraft && (
                    <form
                      action={updateTrainingDayAction}
                      className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#242C3A]/60 pt-3"
                    >
                      <input type="hidden" name="programId" value={program.id} />
                      <input type="hidden" name="trainingDayId" value={day.id} />
                      <Input
                        name="name"
                        defaultValue={day.name}
                        required
                        className="h-8 w-44 bg-[#090B0E] border-[#242C3A] text-xs"
                      />
                      <select
                        name="dayOfWeek"
                        defaultValue={day.dayOfWeek}
                        className="h-8 rounded-md border border-[#242C3A] bg-[#090B0E] px-2 text-xs text-[#F3F5F7]"
                      >
                        {Object.entries(DAY_OF_WEEK_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <Input
                        name="description"
                        defaultValue={day.description ?? ""}
                        placeholder="Descrição opcional..."
                        className="h-8 flex-1 min-w-[160px] bg-[#090B0E] border-[#242C3A] text-xs"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#242C3A] text-xs"
                      >
                        Atualizar Dia
                      </Button>
                    </form>
                  )}
                </CardHeader>

                {/* Exercises List inside the Day */}
                <CardContent className="p-4 space-y-4">
                  {day.workoutExercises.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#242C3A] p-6 text-center text-xs text-[#9BA3AF]">
                      Nenhum exercício prescrito neste dia ainda.
                    </div>
                  ) : (
                    day.workoutExercises.map((wex, exIndex) => {
                      const firstSet = wex.sets[0];
                      return (
                        <div
                          key={wex.id}
                          className="rounded-xl border border-[#242C3A] bg-[#090B0E]/80 p-4 space-y-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                                  {exIndex + 1}
                                </span>
                                <Link
                                  href={`/coach/exercises/${wex.exerciseId}`}
                                  className="text-sm font-semibold text-[#F3F5F7] hover:text-emerald-300"
                                >
                                  {wex.exercise.name}
                                </Link>
                                <Badge variant="outline" className="text-[10px]">
                                  {SECTION_TYPE_LABELS[
                                    wex.sectionType as SectionTypeInput
                                  ] ?? wex.sectionType}
                                </Badge>
                                {wex.supersetGroupId && (
                                  <Badge variant="emerald" className="text-[10px]">
                                    Super-série {wex.supersetGroupId}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-[#9BA3AF]">
                                {wex.exercise.category.name} •{" "}
                                {wex.exercise.primaryMuscleGroup}
                              </p>
                            </div>

                            {isDraft && (
                              <div className="flex items-center gap-1">
                                <form action={moveWorkoutExerciseAction}>
                                  <input
                                    type="hidden"
                                    name="programId"
                                    value={program.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="trainingDayId"
                                    value={day.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="workoutExerciseId"
                                    value={wex.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="direction"
                                    value="up"
                                  />
                                  <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                    disabled={exIndex === 0}
                                    className="h-7 w-7 p-0 border-[#242C3A]"
                                    title="Subir exercício"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                </form>

                                <form action={moveWorkoutExerciseAction}>
                                  <input
                                    type="hidden"
                                    name="programId"
                                    value={program.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="trainingDayId"
                                    value={day.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="workoutExerciseId"
                                    value={wex.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="direction"
                                    value="down"
                                  />
                                  <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      exIndex === day.workoutExercises.length - 1
                                    }
                                    className="h-7 w-7 p-0 border-[#242C3A]"
                                    title="Descer exercício"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </form>

                                <form action={removeWorkoutExerciseAction}>
                                  <input
                                    type="hidden"
                                    name="programId"
                                    value={program.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="workoutExerciseId"
                                    value={wex.id}
                                  />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    title="Remover exercício"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </form>
                              </div>
                            )}
                          </div>

                          {/* Sets Table */}
                          <div className="overflow-x-auto rounded-lg border border-[#242C3A]/80">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#12161D] text-[11px] uppercase text-[#9BA3AF]">
                                <tr>
                                  <th className="px-3 py-2">Série</th>
                                  <th className="px-3 py-2">Reps Alvo</th>
                                  <th className="px-3 py-2">Carga Sugerida</th>
                                  <th className="px-3 py-2">Descanso</th>
                                  <th className="px-3 py-2">Cadência</th>
                                  <th className="px-3 py-2">RPE</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#242C3A]/50">
                                {wex.sets.map((s) => (
                                  <tr key={s.id} className="text-[#F3F5F7]">
                                    <td className="px-3 py-1.5 font-semibold text-emerald-400">
                                      #{s.setNumber}
                                    </td>
                                    <td className="px-3 py-1.5">{s.repsTarget}</td>
                                    <td className="px-3 py-1.5">
                                      {s.suggestedLoadKg !== null
                                        ? `${Number(s.suggestedLoadKg)} kg`
                                        : "—"}
                                    </td>
                                    <td className="px-3 py-1.5">{s.restSeconds}s</td>
                                    <td className="px-3 py-1.5">{s.tempo ?? "—"}</td>
                                    <td className="px-3 py-1.5">
                                      {s.targetRpe !== null
                                        ? Number(s.targetRpe)
                                        : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {wex.coachNotes && (
                            <p className="rounded-md border border-[#242C3A] bg-[#12161D] px-3 py-2 text-xs text-[#9BA3AF]">
                              <strong className="text-[#F3F5F7]">
                                Observação do Treinador:
                              </strong>{" "}
                              {wex.coachNotes}
                            </p>
                          )}

                          {/* Inline Prescription Editor (When in DRAFT) */}
                          {isDraft && (
                            <form
                              action={updateWorkoutExerciseAction}
                              className="grid grid-cols-2 gap-2 border-t border-[#242C3A]/60 pt-3 sm:grid-cols-7"
                            >
                              <input
                                type="hidden"
                                name="programId"
                                value={program.id}
                              />
                              <input
                                type="hidden"
                                name="workoutExerciseId"
                                value={wex.id}
                              />
                              <input
                                type="hidden"
                                name="sectionType"
                                value={wex.sectionType}
                              />

                              <div>
                                <span className="block text-[10px] text-[#9BA3AF]">
                                  Séries
                                </span>
                                <Input
                                  name="setsCount"
                                  type="number"
                                  min={1}
                                  max={15}
                                  defaultValue={wex.sets.length}
                                  className="h-7 bg-[#12161D] border-[#242C3A] text-xs"
                                />
                              </div>

                              <div>
                                <span className="block text-[10px] text-[#9BA3AF]">
                                  Reps
                                </span>
                                <Input
                                  name="repsTarget"
                                  defaultValue={firstSet?.repsTarget ?? "10-12"}
                                  className="h-7 bg-[#12161D] border-[#242C3A] text-xs"
                                />
                              </div>

                              <div>
                                <span className="block text-[10px] text-[#9BA3AF]">
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
                                  className="h-7 bg-[#12161D] border-[#242C3A] text-xs"
                                />
                              </div>

                              <div>
                                <span className="block text-[10px] text-[#9BA3AF]">
                                  Descanso (s)
                                </span>
                                <Input
                                  name="restSeconds"
                                  type="number"
                                  defaultValue={firstSet?.restSeconds ?? 60}
                                  className="h-7 bg-[#12161D] border-[#242C3A] text-xs"
                                />
                              </div>

                              <div>
                                <span className="block text-[10px] text-[#9BA3AF]">
                                  Super-série
                                </span>
                                <Input
                                  name="supersetGroupId"
                                  defaultValue={wex.supersetGroupId ?? ""}
                                  placeholder="A1"
                                  className="h-7 bg-[#12161D] border-[#242C3A] text-xs"
                                />
                              </div>

                              <div>
                                <span className="block text-[10px] text-[#9BA3AF]">
                                  Notas
                                </span>
                                <Input
                                  name="coachNotes"
                                  defaultValue={wex.coachNotes ?? ""}
                                  placeholder="Nota técnica..."
                                  className="h-7 bg-[#12161D] border-[#242C3A] text-xs"
                                />
                              </div>

                              <div className="flex items-end">
                                <Button
                                  type="submit"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-full border-[#242C3A] text-[11px]"
                                >
                                  Salvar
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {/* Save Current Version as Reusable Template */}
          {activeVersion.trainingDays.length > 0 && (
            <Card className="border-[#242C3A] bg-[#12161D]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#F3F5F7] flex items-center gap-2">
                  <Copy className="h-4 w-4 text-emerald-400" />
                  Salvar Versão v{activeVersion.versionNumber} como Template Reutilizável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SaveTemplateForm
                  programId={program.id}
                  versionId={activeVersion.id}
                  defaultTitle={program.title}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
