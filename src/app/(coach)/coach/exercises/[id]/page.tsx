import { notFound } from "next/navigation";
import { ShieldAlert, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaPreview } from "@/components/ui/media-preview";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        backHref="/coach/exercises"
        backLabel="Voltar para a biblioteca"
        title={exercise.name}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{exercise.category.name}</Badge>
            <Badge variant={exercise.isGlobal ? "secondary" : "emerald"}>
              {exercise.isGlobal ? "Catálogo Oficial" : "Personalizado"}
            </Badge>
          </div>
        }
        actions={
          isEditable ? (
            <form action={deleteExerciseAction}>
              <input type="hidden" name="exerciseId" value={exercise.id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Excluir exercício
              </Button>
            </form>
          ) : undefined
        }
      />

      {/* Main Details & Demonstration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className="rounded-lg border border-border bg-card p-5 space-y-5 self-start">
          <h2 className="text-sm font-semibold text-foreground">
            Demonstração e biomecânica
          </h2>

          {primaryMedia?.url ? (
            <MediaPreview
              url={primaryMedia.url}
              alt={`Demonstração de ${exercise.name}`}
              aspectRatio="4/3"
              fit="contain"
              className="min-h-[280px] sm:min-h-[340px]"
            />
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhuma mídia demonstrativa cadastrada.
            </div>
          )}

          <dl className="divide-y divide-border/70 border-t border-border text-xs">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-muted-foreground">Músculo principal</dt>
              <dd className="font-medium text-primary">{exercise.primaryMuscleGroup}</dd>
            </div>

            {exercise.secondaryMuscleGroups.length > 0 && (
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">Sinergistas</dt>
                <dd className="text-right text-foreground">
                  {exercise.secondaryMuscleGroups.join(", ")}
                </dd>
              </div>
            )}

            <div className="flex items-center justify-between py-2.5">
              <dt className="text-muted-foreground">Equipamento</dt>
              <dd className="text-foreground">
                {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
              </dd>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <dt className="text-muted-foreground">Complexidade</dt>
              <dd className="text-foreground">
                {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty}
              </dd>
            </div>
          </dl>
        </aside>

        {/* Instructions & Execution Cues */}
        <section className="lg:col-span-2 rounded-lg border border-border bg-card p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">
            Instruções técnicas e segurança
          </h2>

          {exercise.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {exercise.description}
            </p>
          )}

          {exercise.instructions.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhuma instrução passo a passo cadastrada para este exercício.
            </div>
          ) : (
            <ol className="divide-y divide-border/70 border-t border-border">
              {exercise.instructions.map((step) => (
                <li key={step.id} className="py-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary font-mono text-xs font-semibold text-primary">
                      {step.stepNumber}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">
                      {step.instruction}
                    </p>
                  </div>

                  {step.safetyTip && (
                    <div className="sm:ml-9 flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs text-amber-200">
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
        </section>
      </div>

      {/* Edit Section */}
      {isEditable ? (
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Editar exercício personalizado
          </h2>
          <ExerciseForm
            categories={categories}
            submitLabel="Salvar alterações"
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
        </section>
      ) : (
        <p className="rounded-lg border border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
          Este exercício pertence ao catálogo oficial global do FitFlow e é somente leitura. Para adaptar parâmetros à sua metodologia, cadastre uma variação personalizada na biblioteca.
        </p>
      )}
    </div>
  );
}
