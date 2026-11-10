import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  ExternalLink,
  Globe,
  Lock,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getExerciseForTenant,
  listExerciseCategories,
} from "@/modules/exercises/service";
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS } from "@/modules/exercises/types";
import { requireCoachContext } from "@/server/auth/session";
import { NotFoundError } from "@/server/errors";
import { deleteExerciseAction } from "../actions";
import { ExerciseForm } from "../exercise-form";

export default async function CoachExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireCoachContext();
  const { id } = await params;

  let exercise;
  try {
    exercise = await getExerciseForTenant(ctx, id);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  const categories = await listExerciseCategories();
  const isEditable = !exercise.isGlobal && exercise.tenantId === ctx.tenantId;
  const primaryMedia = exercise.media[0];
  const firstSafetyTip = exercise.instructions.find((step) => step.safetyTip)?.safetyTip ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/coach/exercises"
            className="inline-flex items-center gap-1.5 text-xs text-[#9BA3AF] hover:text-[#F3F5F7] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para a Biblioteca de Exercícios
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">
              {exercise.name}
            </h1>
            <Badge variant="outline">{exercise.category.name}</Badge>
            {exercise.isGlobal ? (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                Catálogo Oficial FitFlow
              </Badge>
            ) : (
              <Badge variant="emerald" className="gap-1">
                <Lock className="h-3.5 w-3.5" />
                Personalizado do Tenant
              </Badge>
            )}
          </div>
        </div>

        {isEditable && (
          <form action={deleteExerciseAction}>
            <input type="hidden" name="exerciseId" value={exercise.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Exercício
            </Button>
          </form>
        )}
      </div>

      {/* Main Details & Demonstration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-[#242C3A] bg-[#12161D] lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#F3F5F7]">
              Demonstração & Biomecânica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryMedia?.url ? (
              primaryMedia.url.startsWith("/images/") ? (
                <div className="overflow-hidden rounded-lg border border-[#242C3A] bg-[#090B0E]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryMedia.url}
                    alt={`Demonstração de ${exercise.name}`}
                    className="w-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-[#242C3A] bg-[#090B0E] p-4 space-y-2">
                  <p className="text-xs font-medium text-[#F3F5F7]">
                    Mídia Externa ({primaryMedia.mediaType})
                  </p>
                  <a
                    href={primaryMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline break-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {primaryMedia.url}
                  </a>
                </div>
              )
            ) : (
              <div className="rounded-lg border border-dashed border-[#242C3A] p-6 text-center text-xs text-[#9BA3AF]">
                Nenhuma mídia demonstrativa cadastrada.
              </div>
            )}

            <div className="space-y-2.5 text-xs border-t border-[#242C3A] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[#9BA3AF]">Músculo Principal:</span>
                <span className="font-semibold text-emerald-400">
                  {exercise.primaryMuscleGroup}
                </span>
              </div>

              {exercise.secondaryMuscleGroups.length > 0 && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#9BA3AF]">Sinergistas:</span>
                  <span className="text-right text-[#F3F5F7]">
                    {exercise.secondaryMuscleGroups.join(", ")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[#9BA3AF]">Equipamento:</span>
                <span className="inline-flex items-center gap-1 text-[#F3F5F7]">
                  <Dumbbell className="h-3.5 w-3.5 text-[#647082]" />
                  {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#9BA3AF]">Complexidade:</span>
                <span className="text-[#F3F5F7]">
                  {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions & Execution Cues */}
        <Card className="border-[#242C3A] bg-[#12161D] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#F3F5F7]">
              Instruções Técnicas e Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercise.description && (
              <p className="text-sm text-[#9BA3AF] leading-relaxed">
                {exercise.description}
              </p>
            )}

            {exercise.instructions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#242C3A] p-6 text-center text-xs text-[#9BA3AF]">
                Nenhuma instrução passo a passo cadastrada para este exercício.
              </div>
            ) : (
              <ol className="space-y-3">
                {exercise.instructions.map((step) => (
                  <li
                    key={step.id}
                    className="rounded-lg border border-[#242C3A] bg-[#090B0E]/70 p-3.5 space-y-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        {step.stepNumber}
                      </span>
                      <p className="text-sm text-[#F3F5F7] leading-relaxed">
                        {step.instruction}
                      </p>
                    </div>

                    {step.safetyTip && (
                      <div className="ml-8 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <span>
                          <strong>Atenção postural:</strong> {step.safetyTip}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Section (Only for Tenant Custom Exercises) */}
      {isEditable ? (
        <Card className="border-[#242C3A] bg-[#12161D]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#F3F5F7]">
              Editar Exercício Personalizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseForm
              categories={categories}
              submitLabel="Salvar Alterações"
              initialValues={{
                id: exercise.id,
                categoryId: exercise.categoryId,
                name: exercise.name,
                description: exercise.description,
                primaryMuscleGroup: exercise.primaryMuscleGroup,
                secondaryMuscleGroups: exercise.secondaryMuscleGroups,
                equipment: exercise.equipment,
                difficulty: exercise.difficulty,
                instructionsText: exercise.instructions
                  .map((s) => s.instruction)
                  .join("\n"),
                safetyTip: firstSafetyTip,
                mediaUrl: primaryMedia?.url ?? "",
                mediaType: primaryMedia?.mediaType ?? "IMAGE",
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#242C3A] bg-[#12161D]/60">
          <CardContent className="flex items-center gap-3 p-4 text-xs text-[#9BA3AF]">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Este exercício faz parte do catálogo oficial global do FitFlow e é somente leitura. Caso deseje uma variação específica para a sua metodologia, cadastre um exercício personalizado na biblioteca.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
