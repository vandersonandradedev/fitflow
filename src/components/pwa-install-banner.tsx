"use client";

import { useEffect, useState } from "react";
import { Compass, Download, Share2, PlusSquare, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(true); // Abre direto com o guia no iOS para clareza

  useEffect(() => {
    // 1. Se já estiver rodando como aplicativo instalado (standalone), não exibe nada
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return;
    }

    // 2. Se o usuário já dispensou nas últimas 24 horas
    const dismissedAt = localStorage.getItem("fitflow_pwa_dismissed");
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    // 3. Detectar dispositivo móvel iOS ou Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isInApp = /instagram|fbav|fban|whatsapp|line|micromessenger|telegram|snapchat/i.test(userAgent);

    setIsInAppBrowser(isInApp);

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

    if (isAndroidDevice) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
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
    try {
      localStorage.setItem("fitflow_pwa_dismissed", Date.now().toString());
    } catch {}
  };

  if (!showBanner) {
    return null;
  }

  return (
    <aside
      aria-label="Instalação do Aplicativo"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[70] mx-auto max-w-md rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/90 md:bottom-6 animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Modo App Nativo</span>
            </div>
            <p className="text-sm font-semibold text-foreground">Abrir em Tela Cheia (Sem Navegador)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar aviso"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Instruções para In-App Browser (WhatsApp, Instagram, etc) */}
      {isInAppBrowser && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-2">
          <p className="font-semibold flex items-center gap-1.5 text-amber-100">
            <Compass className="h-4 w-4 text-amber-300" />
            Você está no navegador interno:
          </p>
          <p className="text-[11px] leading-relaxed text-amber-200/90">
            1. Toque no ícone da <strong>bússola / Safari</strong> no canto inferior direito para abrir no Safari oficial.
          </p>
          <p className="text-[11px] leading-relaxed text-amber-200/90">
            2. Depois siga os 2 passos abaixo no Safari para virar um App na tela inicial.
          </p>
        </div>
      )}

      {/* Instruções passo a passo iOS Safari */}
      {isIos && showIosGuide && (
        <div className="mt-3 rounded-xl border border-border/80 bg-background/90 p-3 text-xs text-muted-foreground space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Instalar na Tela de Início do iPhone:
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-primary font-bold">
              <Share2 className="h-3.5 w-3.5" />
            </div>
            <span className="text-[12px] text-foreground/90">
              1. Toque no botão <strong>Compartilhar</strong> (ícone central abaixo).
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-primary font-bold">
              <PlusSquare className="h-3.5 w-3.5" />
            </div>
            <span className="text-[12px] text-foreground/90">
              2. Selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/80 pt-1 border-t border-border/50">
            ✨ O FitFlow abrirá sem a barra do navegador, 100% em tela cheia como um App da App Store.
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          Lembrar depois
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleInstallClick}
          className="h-8 text-xs font-semibold gap-1.5"
        >
          {isIos ? (showIosGuide ? "Entendi!" : "Ver como instalar") : (
            <>
              <Download className="h-3.5 w-3.5" />
              Instalar App
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
