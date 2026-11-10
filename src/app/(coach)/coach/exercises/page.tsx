import Link from "next/link";
import { BookOpen, Dumbbell, Globe, Lock, PlusCircle, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  listExerciseCategories,
  listExercisesForTenant,
} from "@/modules/exercises/service";
import {
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  type EquipmentTypeInput,
} from "@/modules/exercises/types";
import { requireCoachContext } from "@/server/auth/session";
import { ExerciseForm } from "./exercise-form";

export default async function CoachExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    categorySlug?: string;
    equipment?: string;
    scope?: string;
    muscleGroup?: string;
  }>;
}) {
  const ctx = await requireCoachContext();
  const params = await searchParams;

  const validScope =
    params.scope === "GLOBAL" || params.scope === "CUSTOM" || params.scope === "ALL"
      ? params.scope
      : "ALL";

  const validEquipment =
    params.equipment && params.equipment in EQUIPMENT_LABELS
      ? (params.equipment as EquipmentTypeInput)
      : undefined;

  const categories = await listExerciseCategories();

  const exercises = await listExercisesForTenant(ctx, {
    search: params.search || undefined,
    categorySlug: params.categorySlug || undefined,
    equipment: validEquipment,
    muscleGroup: params.muscleGroup || undefined,
    scope: validScope,
  });

  const customCount = exercises.filter((ex) => !ex.isGlobal).length;
  const globalCount = exercises.filter((ex) => ex.isGlobal).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F3F5F7]">
            Biblioteca de Exercícios
          </h1>
          <p className="text-sm text-[#9BA3AF]">
            Consulte o catálogo anatômico global e cadastre exercícios exclusivos do seu estúdio.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5">
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            {globalCount} Globais
          </Badge>
          <Badge variant="emerald" className="gap-1.5 py-1 px-2.5">
            <Lock className="h-3.5 w-3.5" />
            {customCount} Personalizados
          </Badge>
        </div>
      </div>

      {/* Category Pills (12 Anatomical Categories) */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/coach/exercises"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !params.categorySlug
              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
              : "border-[#242C3A] bg-[#12161D] text-[#9BA3AF] hover:text-[#F3F5F7]"
          }`}
        >
          Todas as Categorias ({categories.length})
        </Link>
        {categories.map((cat) => {
          const active = params.categorySlug === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/coach/exercises?categorySlug=${encodeURIComponent(cat.slug)}${
                validScope !== "ALL" ? `&scope=${validScope}` : ""
              }`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-[#242C3A] bg-[#12161D] text-[#9BA3AF] hover:text-[#F3F5F7]"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Search & Multi-Attribute Filters */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            Filtros do Catálogo ({exercises.length} encontrados)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {params.categorySlug && (
              <input type="hidden" name="categorySlug" value={params.categorySlug} />
            )}

            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#647082]" />
              <Input
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Buscar por nome, descrição ou músculo..."
                className="h-9 pl-8 bg-[#090B0E] border-[#242C3A] text-xs"
              />
            </div>

            <Input
              name="muscleGroup"
              defaultValue={params.muscleGroup ?? ""}
              placeholder="Grupo muscular (ex: Dorsal)"
              className="h-9 bg-[#090B0E] border-[#242C3A] text-xs"
            />

            <select
              name="equipment"
              defaultValue={validEquipment ?? ""}
              className="h-9 rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 text-xs text-[#F3F5F7]"
            >
              <option value="">Todos os equipamentos</option>
              {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <select
                name="scope"
                defaultValue={validScope}
                className="h-9 flex-1 rounded-md border border-[#242C3A] bg-[#090B0E] px-2.5 text-xs text-[#F3F5F7]"
              >
                <option value="ALL">Globais + Meus</option>
                <option value="GLOBAL">Somente Globais</option>
                <option value="CUSTOM">Somente Personalizados</option>
              </select>
              <Button type="submit" variant="outline" size="sm" className="border-[#242C3A] h-9">
                Filtrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Exercise Cards Grid */}
      {exercises.length === 0 ? (
        <Card className="border-dashed border-[#242C3A] bg-[#12161D]/60">
          <CardContent className="p-8 text-center">
            <p className="text-sm font-medium text-[#F3F5F7]">
              Nenhum exercício encontrado para os filtros selecionados.
            </p>
            <p className="mt-1 text-xs text-[#9BA3AF]">
              Limpe os filtros ou cadastre um exercício personalizado abaixo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => {
            const primaryMedia = exercise.media[0];
            const firstSafetyTip = exercise.instructions.find((i) => i.safetyTip)?.safetyTip;

            return (
              <Link
                key={exercise.id}
                href={`/coach/exercises/${exercise.id}`}
                className="group flex flex-col justify-between rounded-xl border border-[#242C3A] bg-[#12161D] p-4 transition-all hover:border-emerald-500/40"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {exercise.category.name}
                    </Badge>
                    {exercise.isGlobal ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Globe className="h-3 w-3 text-emerald-400" />
                        Catálogo Oficial
                      </Badge>
                    ) : (
                      <Badge variant="emerald" className="text-[10px] gap-1">
                        <Lock className="h-3 w-3" />
                        Personalizado
                      </Badge>
                    )}
                  </div>

                  {/* Preview Diagram / Thumbnail */}
                  {primaryMedia?.url && primaryMedia.url.startsWith("/images/") && (
                    <div className="overflow-hidden rounded-lg border border-[#242C3A]/80 bg-[#090B0E]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={primaryMedia.url}
                        alt={`Demonstração de ${exercise.name}`}
                        className="h-32 w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-semibold text-[#F3F5F7] group-hover:text-emerald-300 transition-colors">
                      {exercise.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-emerald-400 font-medium">
                      {exercise.primaryMuscleGroup}
                      {exercise.secondaryMuscleGroups.length > 0
                        ? ` • +${exercise.secondaryMuscleGroups.join(", ")}`
                        : ""}
                    </p>
                  </div>

                  {exercise.description && (
                    <p className="line-clamp-2 text-xs text-[#9BA3AF]">{exercise.description}</p>
                  )}

                  {firstSafetyTip && (
                    <div className="flex items-start gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-[#9BA3AF]">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <span className="line-clamp-2">{firstSafetyTip}</span>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="mt-4 flex items-center justify-between border-t border-[#242C3A]/60 pt-3 text-[11px] text-[#9BA3AF]">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5 text-[#647082]" />
                    {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
                  </span>
                  <span>
                    {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty} •{" "}
                    {exercise.instructions.length} passos
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Custom Exercise Form */}
      <Card className="border-[#242C3A] bg-[#12161D]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#F3F5F7] flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-emerald-400" />
            Cadastrar Exercício Personalizado do Seu Tenant
          </CardTitle>
          <p className="text-xs text-[#9BA3AF]">
            Exercícios personalizados ficam visíveis apenas para você e para os alunos vinculados ao seu ambiente.
          </p>
        </CardHeader>
        <CardContent>
          <ExerciseForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
