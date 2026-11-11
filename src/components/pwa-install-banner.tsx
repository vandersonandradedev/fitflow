"use client";

import { useEffect, useState } from "react";
import { Download, Share2, PlusSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Se já estiver rodando como aplicativo instalado (standalone), não exibe nada
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Se o usuário já dispensou recentemente
    const dismissedAt = localStorage.getItem("fitflow_pwa_dismissed");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return;
      }
    }

    // 3. Detectar dispositivo móvel iOS ou Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);

    if (isIosDevice) {
      setIsIos(true);
      setShowBanner(true);
      return;
    }

    // 4. Capturar evento de instalação nativo no Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Se for Android e o evento demorar ou não disparar, exibe sugestão informativa
    if (isAndroidDevice) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    try {
      localStorage.setItem("fitflow_pwa_dismissed", Date.now().toString());
    } catch {
      // Ignorar caso cookies/storage estejam restritos
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <aside
      aria-label="Instalação do Aplicativo"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-primary/30 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md supports-[backdrop-filter]:bg-card/85 md:bottom-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Instalar FitFlow no celular</p>
            <p className="text-xs text-muted-foreground">
              Abra em tela cheia sem barra de navegador, igual a um app nativo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar aviso"
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIosGuide && (
        <div className="mt-3 rounded-lg border border-border bg-background/80 p-2.5 text-xs text-muted-foreground space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <span>Passo a passo no iPhone / iPad:</span>
          </div>
          <div className="flex items-center gap-2">
            <Share2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>1. Toque no botão de <strong>Compartilhar</strong> do Safari.</span>
          </div>
          <div className="flex items-center gap-2">
            <PlusSquare className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>2. Role para baixo e selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong>.</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-8 text-xs text-muted-foreground"
        >
          Agora não
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleInstallClick}
          className="h-8 text-xs font-semibold"
        >
          {isIos ? (showIosGuide ? "Entendi" : "Como instalar") : "Instalar App"}
        </Button>
      </div>
    </aside>
  );
}
