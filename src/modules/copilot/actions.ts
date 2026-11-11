"use server";

import { revalidatePath } from "next/cache";
import { requireCoachContext } from "@/server/auth/session";
import { analyzeProgressiveOverload, applyCopilotSuggestions } from "./service";

export async function analyzeDayCopilotAction(trainingDayId: string) {
  try {
    const ctx = await requireCoachContext();
    const analysis = await analyzeProgressiveOverload(ctx, trainingDayId);
    return { ok: true, analysis };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Erro ao analisar sobrecarga progressiva.",
    };
  }
}

export async function applyCopilotSuggestionsAction(
  trainingDayId: string,
  suggestions: Array<{ exerciseId: string; suggestedLoadKg: number | null; suggestedReps: string }>
) {
  try {
    const ctx = await requireCoachContext();
    const result = await applyCopilotSuggestions(ctx, trainingDayId, suggestions);
    revalidatePath("/coach/workouts");
    return { ok: true, updatedSetsCount: result.updatedSetsCount };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Erro ao aplicar sugestões do Copilot.",
    };
  }
}
