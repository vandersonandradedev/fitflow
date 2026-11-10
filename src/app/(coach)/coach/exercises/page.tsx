import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
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
import { CreateExerciseDialog } from "./exercise-form";

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
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de Exercícios"
        description="Consulte o catálogo anatômico global e cadastre variações exclusivas do seu estúdio."
        meta={
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {globalCount} globais · {customCount} personalizados
          </span>
        }
        actions={<CreateExerciseDialog categories={categories} />}
      />

      {/* Category Filter Strip (Sharp tabs, no rounded-full pill bloat) */}
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible">
        <Link
          href="/coach/exercises"
          className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            !params.categorySlug
              ? "border-primary/40 bg-secondary text-foreground"
              : "border-transparent bg-card text-muted-foreground hover:border-border hover:text-foreground"
          }`}
        >
          Todas ({categories.length})
        </Link>
        {categories.map((cat) => {
          const active = params.categorySlug === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/coach/exercises?categorySlug=${encodeURIComponent(cat.slug)}${
                validScope !== "ALL" ? `&scope=${validScope}` : ""
              }`}
              className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary/40 bg-secondary text-foreground"
                  : "border-transparent bg-card text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Unified Search & Attribute Filter Bar */}
      <form
        method="GET"
        className="grid grid-cols-1 gap-2.5 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        {params.categorySlug && (
          <input type="hidden" name="categorySlug" value={params.categorySlug} />
        )}

        <div className="relative sm:col-span-2 xl:col-span-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-textMuted" />
          <Input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Buscar por nome, descrição ou músculo..."
            className="pl-8 text-xs"
          />
        </div>

        <Input
          name="muscleGroup"
          defaultValue={params.muscleGroup ?? ""}
          placeholder="Grupo muscular (ex: Dorsal)"
          className="text-xs"
        />

        <Select
          name="equipment"
          defaultValue={validEquipment ?? ""}
          aria-label="Filtrar por equipamento"
          className="text-xs"
        >
          <option value="">Todos os equipamentos</option>
          {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
          <Select
            name="scope"
            defaultValue={validScope}
            aria-label="Filtrar por escopo"
            className="text-xs"
          >
            <option value="ALL">Globais + Meus</option>
            <option value="GLOBAL">Somente globais</option>
            <option value="CUSTOM">Somente personalizados</option>
          </Select>
          <Button type="submit" variant="outline" size="sm" className="h-9 shrink-0">
            Filtrar
          </Button>
        </div>
      </form>

      {/* Catalog Grid */}
      {exercises.length === 0 ? (
        <EmptyState
          title="Nenhum exercício encontrado"
          description="Limpe os filtros ativos ou cadastre um novo exercício personalizado para o seu estúdio."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => {
            const primaryMedia = exercise.media[0];

            return (
              <Link
                key={exercise.id}
                href={`/coach/exercises/${exercise.id}`}
                className="group flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-brand-borderStrong"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {exercise.category.name}
                    </span>
                    <Badge variant={exercise.isGlobal ? "secondary" : "emerald"}>
                      {exercise.isGlobal ? "Oficial" : "Personalizado"}
                    </Badge>
                  </div>

                  {primaryMedia?.url && primaryMedia.url.startsWith("/images/") && (
                    <div className="overflow-hidden rounded-md border border-border bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={primaryMedia.url}
                        alt={`Demonstração de ${exercise.name}`}
                        className="h-28 w-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <h2 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {exercise.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-primary">
                      {exercise.primaryMuscleGroup}
                      {exercise.secondaryMuscleGroups.length > 0
                        ? ` · ${exercise.secondaryMuscleGroups.join(", ")}`
                        : ""}
                    </p>
                  </div>

                  {exercise.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {exercise.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
                  <span>{EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}</span>
                  <span className="font-mono tabular-nums">
                    {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty} ·{" "}
                    {exercise.instructions.length} passos
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
