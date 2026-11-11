"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  CheckCircle2,
  Clock,
  Flame,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface RestChronometerProps {
  initialSeconds?: number;
  autoStart?: boolean;
  nextSetLabel?: string;
  onFinish?: () => void;
  onCancel?: () => void;
  className?: string;
}

// Síntese de áudio para avisos de contagem e término sem dependência de arquivos externos
function playTone(freq: number, duration = 0.15, gainLevel = 0.2) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playCompletionChime() {
  try {
    // Tríade ascendente revigorante (C5 -> E5 -> G5)
    setTimeout(() => playTone(523.25, 0.2, 0.25), 0);
    setTimeout(() => playTone(659.25, 0.2, 0.25), 120);
    setTimeout(() => playTone(783.99, 0.4, 0.3), 240);
  } catch {}
}

function triggerHaptic(pattern: number[] = [150, 70, 150]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

function formatMinutesSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const RestChronometer = memo(function RestChronometer({
  initialSeconds = 60,
  autoStart = true,
  nextSetLabel,
  onFinish,
  onCancel,
  className,
}: RestChronometerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolledOutOfView, setIsScrolledOutOfView] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Monitora visibilidade na viewport para exibir a sticky bar flutuante
  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolledOutOfView(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Armazena timestamp alvo para evitar drift do setInterval
  const targetEndRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const lastSecondBeepedRef = useRef<number | null>(null);

  // Inicializa ou reinicia cronômetro quando initialSeconds mudar
  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setRemaining(initialSeconds);
    setIsActive(autoStart);
    setIsFinished(false);
    targetEndRef.current = Date.now() + initialSeconds * 1000;
    lastSecondBeepedRef.current = null;
  }, [initialSeconds, autoStart]);

  // Loop de alta precisão (100ms) para animação suave
  useEffect(() => {
    if (!isActive || isFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = targetEndRef.current - now;
      const leftSec = Math.max(0, Math.ceil(diffMs / 1000));

      setRemaining(leftSec);

      // Beep de contagem regressiva nos últimos 3 segundos (3, 2, 1)
      if (!isMuted && leftSec > 0 && leftSec <= 3 && lastSecondBeepedRef.current !== leftSec) {
        lastSecondBeepedRef.current = leftSec;
        playTone(leftSec === 1 ? 880 : 660, 0.12, 0.18);
        triggerHaptic([60]);
      }

      // Fim do descanso
      if (diffMs <= 0) {
        setIsActive(false);
        setIsFinished(true);
        if (!isMuted) {
          playCompletionChime();
        }
        triggerHaptic([200, 100, 250]);
        if (onFinish) {
          onFinish();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, isFinished, isMuted, onFinish]);

  // Controles rápidos
  const togglePlayPause = useCallback(() => {
    if (isFinished) {
      // Reiniciar
      const nextTotal = totalSeconds || 60;
      targetEndRef.current = Date.now() + nextTotal * 1000;
      setRemaining(nextTotal);
      setIsFinished(false);
      setIsActive(true);
      return;
    }

    if (isActive) {
      setIsActive(false);
    } else {
      // Retomar recalculando targetEnd a partir do remaining atual
      targetEndRef.current = Date.now() + remaining * 1000;
      setIsActive(true);
    }
  }, [isActive, isFinished, remaining, totalSeconds]);

  const addTime = useCallback((deltaSec: number) => {
    targetEndRef.current += deltaSec * 1000;
    setTotalSeconds((prev) => Math.max(prev + deltaSec, prev));
    setRemaining((prev) => Math.max(0, prev + deltaSec));
    setIsFinished(false);
    if (!isActive) {
      setIsActive(true);
    }
    triggerHaptic([40]);
  }, [isActive]);

  const subtractTime = useCallback((deltaSec: number) => {
    targetEndRef.current -= deltaSec * 1000;
    const now = Date.now();
    const newRemaining = Math.max(0, Math.ceil((targetEndRef.current - now) / 1000));
    setRemaining(newRemaining);
    if (newRemaining <= 0) {
      setIsActive(false);
      setIsFinished(true);
      onFinish?.();
    }
    triggerHaptic([40]);
  }, [onFinish]);

  const resetToPreset = useCallback((presetSec: number) => {
    setTotalSeconds(presetSec);
    setRemaining(presetSec);
    setIsFinished(false);
    targetEndRef.current = Date.now() + presetSec * 1000;
    setIsActive(true);
    triggerHaptic([50]);
  }, []);

  // Cálculo do raio e progresso circular do SVG
  // Raio = 52, Circunferência = 2 * PI * 52 ≈ 326.72
  const RADIUS = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const safeTotal = totalSeconds > 0 ? totalSeconds : 60;
  const progressRatio = Math.max(0, Math.min(1, remaining / safeTotal));
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  // Estados semânticos de cor
  const isEmergency = remaining <= 5 && remaining > 0 && !isFinished;
  const isWarning = remaining <= 10 && remaining > 5 && !isFinished;

  const ringColorClass = isFinished
    ? "stroke-emerald-400"
    : isEmergency
    ? "stroke-red-500 animate-pulse"
    : isWarning
    ? "stroke-amber-400"
    : "stroke-emerald-500";

  const textColorClass = isFinished
    ? "text-emerald-400"
    : isEmergency
    ? "text-red-400 animate-pulse"
    : isWarning
    ? "text-amber-400"
    : "text-foreground";

  return (
    <>
      <div
        ref={containerRef}
        role="timer"
        aria-live="polite"
        aria-label={`Cronômetro de descanso: ${remaining} segundos restantes`}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-gradient-to-b from-card to-card/90 p-5 shadow-lg backdrop-blur-sm transition-all duration-200",
          isEmergency
            ? "border-red-500/50 shadow-red-500/10 ring-1 ring-red-500/20"
          : isFinished
          ? "border-emerald-500/60 shadow-emerald-500/10 ring-1 ring-emerald-500/20"
          : "border-border shadow-black/20",
        className
      )}
    >
      {/* Background radial glow */}
      <div
        className={cn(
          "pointer-events-none absolute -top-12 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-300",
          isEmergency
            ? "bg-red-500/20 opacity-100"
            : isFinished
            ? "bg-emerald-500/20 opacity-100"
            : isWarning
            ? "bg-amber-500/15 opacity-80"
            : "bg-emerald-500/10 opacity-60"
        )}
      />

      {/* Header bar: Descrição & Toggle de Mudo */}
      <div className="relative flex items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md border text-xs",
              isEmergency
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : isFinished
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-primary/30 bg-primary/10 text-primary"
            )}
          >
            {isFinished ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isEmergency ? (
              <Flame className="h-4 w-4 animate-bounce" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {isFinished
                ? "Descanso Finalizado!"
                : isActive
                ? "Descanso Ativo"
                : "Descanso Pausado"}
            </p>
            {nextSetLabel && (
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                {nextSetLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMuted((prev) => !prev)}
            aria-label={isMuted ? "Ativar som do cronômetro" : "Silenciar cronômetro"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={onCancel}
            >
              <SkipForward className="h-3.5 w-3.5 mr-1" />
              Pular
            </Button>
          )}
        </div>
      </div>

      {/* Hero Circular Progress Ring */}
      <div className="relative my-4 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg
            className="h-36 w-36 sm:h-40 sm:w-40 -rotate-90 transform"
            viewBox="0 0 120 120"
          >
            {/* Background track circle */}
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-secondary/80"
            />
            {/* Active animated progress circle */}
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              strokeWidth="7"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className={cn("transition-[stroke-dashoffset] duration-300 ease-out", ringColorClass)}
            />
          </svg>

          {/* Central Digital Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isFinished ? (
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl font-black tracking-tight text-emerald-400">
                  VAI!
                </span>
                <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                  Próxima série
                </span>
              </div>
            ) : (
              <>
                <span
                  className={cn(
                    "font-mono text-4xl sm:text-5xl font-black tabular-nums tracking-tighter leading-none transition-colors",
                    textColorClass
                  )}
                >
                  {formatMinutesSeconds(remaining)}
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {isActive ? "restantes" : "pausado"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {[30, 45, 60, 90, 120].map((preset) => {
            const isCurrentPreset = totalSeconds === preset && !isFinished;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => resetToPreset(preset)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-mono font-medium transition-colors",
                  isCurrentPreset
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                {preset}s
              </button>
            );
          })}
        </div>
      </div>

      {/* Ergonomic Touch Controls Bar (Large 44px+ touch targets) */}
      <div className="relative mt-2 grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-col gap-0.5 px-2 text-xs font-mono touch-manipulation hover:bg-secondary active:scale-95 transition-transform"
          onClick={() => subtractTime(15)}
          disabled={remaining <= 5}
          aria-label="Diminuir 15 segundos"
        >
          <span className="flex items-center text-xs font-semibold">
            <Minus className="h-3.5 w-3.5 mr-0.5" /> 15s
          </span>
          <span className="text-[9px] text-muted-foreground">Menos</span>
        </Button>

        <Button
          type="button"
          variant={isActive ? "secondary" : "default"}
          size="lg"
          className={cn(
            "col-span-2 h-12 gap-2 text-sm font-semibold touch-manipulation active:scale-[0.98] transition-transform",
            isFinished && "bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
          )}
          onClick={togglePlayPause}
          aria-label={
            isFinished
              ? "Reiniciar descanso"
              : isActive
              ? "Pausar cronômetro"
              : "Iniciar cronômetro"
          }
        >
          {isFinished ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </>
          ) : isActive ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              Pausar
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current ml-0.5" />
              Retomar
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-col gap-0.5 px-2 text-xs font-mono touch-manipulation hover:bg-secondary active:scale-95 transition-transform"
          onClick={() => addTime(30)}
          aria-label="Aumentar 30 segundos"
        >
          <span className="flex items-center text-xs font-semibold text-emerald-400">
            <Plus className="h-3.5 w-3.5 mr-0.5" /> 30s
          </span>
          <span className="text-[9px] text-muted-foreground">Mais</span>
        </Button>
      </div>
    </div>

    {/* Floating Sticky Mini-Bar when main timer is scrolled out of view */}
    {isScrolledOutOfView && remaining > 0 && !isFinished && (
      <StickyRestBar
        remainingSeconds={remaining}
        totalSeconds={safeTotal}
        isActive={isActive}
        onAdd30s={() => addTime(30)}
        onTogglePlay={togglePlayPause}
        onSkip={() => {
          setIsActive(false);
          setRemaining(0);
          onCancel?.();
        }}
        onExpand={() => {
          containerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }}
      />
    )}
  </>
  );
});

/**
 * Mini Barra Flutuante de Descanso (Sticky Bottom Bar)
 * Aparece fixada na parte inferior da tela caso o atleta role para baixo
 * garantindo que ele nunca perca o tempo restante de descanso enquanto consulta anotações.
 */
export const StickyRestBar = memo(function StickyRestBar({
  remainingSeconds,
  totalSeconds,
  isActive,
  onAdd30s,
  onTogglePlay,
  onSkip,
  onExpand,
}: {
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
  onAdd30s: () => void;
  onTogglePlay: () => void;
  onSkip: () => void;
  onExpand: () => void;
}) {
  if (remainingSeconds <= 0) return null;

  const isEmergency = remainingSeconds <= 5;
  const isWarning = remainingSeconds <= 10 && remainingSeconds > 5;
  const progressPct =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
      : 0;

  return (
    <aside
      aria-label="Controle rápido do descanso"
      className={cn(
        "fixed bottom-16 left-3 right-3 z-40 mx-auto max-w-lg overflow-hidden rounded-full border bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-md transition-all duration-200 md:bottom-5 md:left-auto md:right-5 md:w-80",
        isEmergency
          ? "border-red-500/60 shadow-red-500/20 ring-1 ring-red-500/30"
          : isWarning
          ? "border-amber-500/50 shadow-amber-500/10"
          : "border-primary/50 shadow-primary/10"
      )}
    >
      <div
        className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-border/40 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={cn(
            "h-full transition-all duration-200",
            isEmergency ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExpand}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold transition-transform group-hover:scale-105",
              isEmergency
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : isWarning
                ? "bg-amber-500/20 text-amber-400"
                : "bg-primary/20 text-primary"
            )}
          >
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "font-mono text-base font-extrabold tabular-nums tracking-tight",
                  isEmergency ? "text-red-400 animate-pulse" : "text-foreground"
                )}
              >
                {formatMinutesSeconds(remainingSeconds)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                descanso
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAdd30s}
            className="h-8 px-2 font-mono text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            aria-label="Adicionar 30 segundos"
          >
            +30s
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onTogglePlay}
            className="h-8 w-8 rounded-full"
            aria-label={isActive ? "Pausar descanso" : "Retomar descanso"}
          >
            {isActive ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Pular descanso"
          >
            Pular
          </Button>
        </div>
      </div>
    </aside>
  );
});
