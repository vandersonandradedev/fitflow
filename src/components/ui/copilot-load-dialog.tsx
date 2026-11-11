"use client";

import { useState } from "react";
import { ArrowRight, Check, Flame, Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  analyzeDayCopilotAction,
  applyCopilotSuggestionsAction,
} from "@/modules/copilot/actions";
import { CopilotAnalysis, ExerciseSuggestion } from "@/modules/copilot/types";

export function CopilotLoadDialog({
  trainingDayId,
  dayName,
  isDraft = true,
}: {
  trainingDayId: string;
  dayName: string;
  isDraft?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysis, setAnalysis] = useState<CopilotAnalysis | null>(null);
  const [editedSuggestions, setEditedSuggestions] = useState<ExerciseSuggestion[]>([]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    const res = await analyzeDayCopilotAction(trainingDayId);
    setLoading(false);

    if (res.ok && res.analysis) {
      setAnalysis(res.analysis);
      setEditedSuggestions(res.analysis.suggestions);
    } else {
      toast.error(res.message || "Erro ao carregar análise de sobrecarga do aluno.");
      setOpen(false);
    }
  };

  const handleApply = async () => {
    if (!analysis) return;
    setApplying(true);

    const payload = editedSuggestions.map((s) => ({
      exerciseId: s.exerciseId,
      suggestedLoadKg: s.suggestedLoadKg,
      suggestedReps: s.suggestedReps,
    }));

    const res = await applyCopilotSuggestionsAction(trainingDayId, payload);
    setApplying(false);

    if (res.ok) {
      toast.success("Cargas sugeridas aplicadas com sucesso nas séries do treino!");
      setOpen(false);
      window.location.reload();
    } else {
      toast.error(res.message || "Erro ao aplicar sugestões.");
    }
  };

  const updateSuggestedLoad = (exerciseId: string, val: string) => {
    const num = parseFloat(val);
    setEditedSuggestions((prev) =>
      prev.map((s) =>
        s.exerciseId === exerciseId
          ? { ...s, suggestedLoadKg: isNaN(num) ? null : num }
          : s
      )
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-9"
      >
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        Copilot IA (Cargas)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base">
                  Copilot de Sobrecarga Progressiva — {dayName}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Análise fisiológica baseada no RPE e histórico das últimas 4 semanas do aluno.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-xs text-muted-foreground">
                Analisando séries, cargas, 1RM Epley e esforço percebido (RPE)...
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Aluno: </span>
                  <strong className="text-foreground">{analysis.studentName}</strong>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  {analysis.overallTrend}
                </Badge>
              </div>

              <div className="space-y-3">
                {editedSuggestions.map((sug) => {
                  return (
                    <div
                      key={sug.exerciseId}
                      className="rounded-lg border border-border bg-card p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {sug.exerciseName}
                        </span>

                        {sug.progressionTier === "PROGRESSION" && (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
                            <TrendingUp className="h-3 w-3" /> Sobrecarga (+5%)
                          </Badge>
                        )}
                        {sug.progressionTier === "MAINTENANCE" && (
                          <Badge variant="outline" className="text-blue-400 border-blue-500/30 gap-1 text-[11px]">
                            <Zap className="h-3 w-3" /> Estímulo Ótimo
                          </Badge>
                        )}
                        {sug.progressionTier === "DELOAD" && (
                          <Badge variant="outline" className="text-amber-400 border-amber-500/30 gap-1 text-[11px]">
                            <Flame className="h-3 w-3" /> Deload Preventivo
                          </Badge>
                        )}
                        {sug.progressionTier === "NEW_EXERCISE" && (
                          <Badge variant="secondary" className="text-[11px]">
                            Sem Histórico
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-background/50 rounded-md p-2.5 border border-border/50">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Carga Prescrita vs Sugerida</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-muted-foreground">
                              {sug.currentLoadKg !== null ? `${sug.currentLoadKg} kg` : "Livre"}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.5"
                                value={sug.suggestedLoadKg ?? ""}
                                onChange={(e) => updateSuggestedLoad(sug.exerciseId, e.target.value)}
                                disabled={!isDraft}
                                className="h-7 w-20 text-xs font-mono font-semibold text-emerald-400"
                              />
                              <span className="text-xs text-muted-foreground">kg</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] text-muted-foreground">Histórico Recente (4 semanas)</p>
                          <p className="font-mono text-xs mt-1 text-foreground">
                            {sug.recentSessionsCount > 0 ? (
                              <>
                                RPE Médio:{" "}
                                <strong className="text-primary">{sug.averageRpe ?? "--"}/10</strong>
                                {sug.estimated1Rm && (
                                  <> · 1RM: <strong>{sug.estimated1Rm} kg</strong></>
                                )}
                              </>
                            ) : (
                              "Nenhuma execução registrada"
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground italic">
                        {sug.rationale}
                      </p>
                    </div>
                  );
                })}
              </div>

              {isDraft ? (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={applying}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApply}
                    disabled={applying}
                    className="gap-1.5"
                  >
                    {applying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Aplicar Cargas no Treino
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-center text-amber-400 border border-amber-500/30 rounded p-2 bg-amber-500/10">
                  Esta versão do programa já está publicada. Crie um novo rascunho (versão v2) para aplicar as sugestões de sobrecarga.
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
