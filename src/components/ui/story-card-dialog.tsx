"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Instagram, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  copyStoryCardToClipboard,
  downloadStoryCardPng,
  drawStoryCard,
  shareStoryCardNative,
  StoryCardData,
} from "@/lib/story-card-generator";

export function StoryCardDialog({
  data,
  isOpen,
  onOpenChange,
  trigger,
}: {
  data: StoryCardData;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (open && canvasRef.current) {
      drawStoryCard(canvasRef.current, data);
    }
  }, [open, data]);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await shareStoryCardNative(data);
      if (res === "shared") {
        toast.success("Pronto para compartilhar nos Stories!");
      } else {
        toast.info("Imagem baixada! Você já pode publicar nos Stories ou Status.");
      }
    } catch {
      toast.error("Não foi possível abrir o compartilhamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    const ok = await downloadStoryCardPng(data, `fitflow-${data.workoutName.toLowerCase().replace(/\s+/g, "-")}.png`);
    setLoading(false);
    if (ok) {
      toast.success("Card baixado com sucesso!");
    } else {
      toast.error("Erro ao gerar imagem.");
    }
  };

  const handleCopy = async () => {
    const ok = await copyStoryCardToClipboard(data);
    if (ok) {
      setCopied(true);
      toast.success("Imagem copiada para a área de transferência! Cole direto no Story.");
      setTimeout(() => setCopied(false), 3000);
    } else {
      // Fallback para download se o navegador não permitir cópia de blob
      await handleDownload();
    }
  };

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto text-center p-5">
          <DialogHeader>
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">
                Card para Instagram Stories
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Compartilhe sua conquista e fortaleça a marca do seu treinador.
            </DialogDescription>
          </DialogHeader>

          {/* Canvas Preview Container (Aspect 9:16) */}
          <div className="relative mx-auto my-3 flex items-center justify-center overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
            <canvas
              ref={canvasRef}
              className="w-full max-w-[280px] h-auto aspect-[9/16] object-contain rounded-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              type="button"
              onClick={handleShare}
              disabled={loading}
              className="w-full h-11 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Instagram className="h-4 w-4" />
              )}
              Compartilhar no Story / WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={loading}
                className="gap-1.5 h-10 text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado!" : "Copiar Imagem"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={loading}
                className="gap-1.5 h-10 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar PNG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
