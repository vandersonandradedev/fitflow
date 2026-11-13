"use client";

import { useState, useTransition } from "react";
import { BellRing, Bot, Check, Droplets, Flame, Loader2, Send, Sparkles, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  generateAINudgeSuggestionAction,
  sendCoachNudgeAction,
} from "@/modules/notifications/coach-actions";

interface NudgeStudentDialogProps {
  studentProfileId: string;
  studentName?: string | null;
}

export function NudgeStudentDialog({
  studentProfileId,
  studentName,
}: NudgeStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Lembrete do seu Treinador ⚡");
  const [message, setMessage] = useState(
    `Olá, ${studentName?.split(" ")[0] || "aluno"}! Passando para lembrar que seu treino está pronto no FitFlow. Bora pra cima!`
  );
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleGenerateAI = async (category: "WORKOUT" | "WATER" | "MOTIVATION" | "CHURN") => {
    setIsAiLoading(true);
    setFeedback(null);
    try {
      const res = await generateAINudgeSuggestionAction(studentProfileId, category);
      if (res.ok && res.title && res.message) {
        setTitle(res.title);
        setMessage(res.message);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      setFeedback({ ok: false, text: "Preencha o título e a mensagem antes de enviar." });
      return;
    }

    startTransition(async () => {
      const res = await sendCoachNudgeAction(studentProfileId, {
        title,
        message,
        type: "WORKOUT_ASSIGNED",
      });

      if (res.ok) {
        setFeedback({ ok: true, text: res.message || "Notificação enviada ao aluno!" });
        setTimeout(() => {
          setOpen(false);
          setFeedback(null);
        }, 2000);
      } else {
        setFeedback({ ok: false, text: res.message || "Erro ao enviar notificação." });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 hover:bg-primary/10">
          <BellRing className="h-4 w-4 text-primary" />
          <span>Notificar Aluno</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Notificar {studentName || "Aluno"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Dispara um pop-up imediato no celular do aluno via Web Push.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* AI Presets Chips */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Sugestões com Agente de IA:
          </Label>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isAiLoading || isPending}
              onClick={() => handleGenerateAI("WORKOUT")}
              className="h-7 text-[11px] gap-1 px-2.5 font-normal"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              Treino de Hoje
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isAiLoading || isPending}
              onClick={() => handleGenerateAI("MOTIVATION")}
              className="h-7 text-[11px] gap-1 px-2.5 font-normal"
            >
              <Flame className="h-3 w-3 text-red-400" />
              Motivação
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isAiLoading || isPending}
              onClick={() => handleGenerateAI("WATER")}
              className="h-7 text-[11px] gap-1 px-2.5 font-normal"
            >
              <Droplets className="h-3 w-3 text-sky-400" />
              Água & Hidratação
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isAiLoading || isPending}
              onClick={() => handleGenerateAI("CHURN")}
              className="h-7 text-[11px] gap-1 px-2.5 font-normal"
            >
              <Bot className="h-3 w-3 text-primary" />
              Aluno Sumido
            </Button>
          </div>
          {isAiLoading && (
            <p className="text-[11px] text-primary flex items-center gap-1 animate-pulse pt-0.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Agente de IA formulando mensagem contextual...
            </p>
          )}
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <Label htmlFor="nudge-title" className="text-xs">
            Título da notificação
          </Label>
          <Input
            id="nudge-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Treino de Hoje te esperando! 🔥"
            className="text-xs"
            disabled={isPending}
            maxLength={60}
          />
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <Label htmlFor="nudge-message" className="text-xs">
            Mensagem do push
          </Label>
          <Textarea
            id="nudge-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva a mensagem para o aluno..."
            className="text-xs resize-none min-h-[80px]"
            disabled={isPending}
            maxLength={180}
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {message.length}/180 caracteres
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
              feedback.ok
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {feedback.ok && <Check className="h-3.5 w-3.5" />}
            {feedback.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSend}
            disabled={isPending || isAiLoading}
            className="gap-1.5 font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Enviando Push...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Enviar Push Agora
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
